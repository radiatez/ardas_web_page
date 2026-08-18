import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";

import { getRuntimeDatabase } from "../db/runtime";
import { securityLogger } from "../security/logging";
import { recordAuth0Login } from "./login-events";

let auth0Client: Auth0Client | undefined;

function safeReturnPath(value: string | undefined): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/admin";
}

export function getAuth0Client(): Auth0Client {
  auth0Client ??= new Auth0Client({
    appBaseUrl: process.env.APP_BASE_URL ?? process.env.SITE_URL,
    authorizationParameters: { scope: "openid profile email" },
    signInReturnToPath: "/admin",
    logoutStrategy: "oidc",
    session: {
      rolling: true,
      absoluteDuration: 60 * 60 * 12,
      inactivityDuration: 60 * 30,
      cookie: {
        sameSite: "lax",
        secure: process.env.APP_ENV === "production",
      },
    },
    async onCallback(error, context, session) {
      const baseUrl = context.appBaseUrl ?? process.env.APP_BASE_URL ?? process.env.SITE_URL;
      if (!baseUrl) {
        throw new Error("APP_BASE_URL is required for the Auth0 callback.");
      }

      if (error || !session) {
        securityLogger.warn("security.auth0_callback_failed", { error });
        return NextResponse.redirect(new URL("/admin/login-error", baseUrl));
      }

      const { db } = getRuntimeDatabase();
      const allowed = await recordAuth0Login(db, session, process.env.APP_ENV);
      if (!allowed) {
        return NextResponse.redirect(new URL("/admin/access-denied", baseUrl));
      }

      return NextResponse.redirect(
        new URL(safeReturnPath(context.returnTo), baseUrl),
      );
    },
  });

  return auth0Client;
}
