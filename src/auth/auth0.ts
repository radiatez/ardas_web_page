import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";

import { getRuntimeDatabase } from "../db/runtime";
import { securityLogger } from "../security/logging";
import { recordAuth0Login } from "./login-events";

let auth0Client: Auth0Client | undefined;

export function hasCompleteAuth0Configuration(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return Boolean(
    environment.AUTH0_DOMAIN &&
      environment.AUTH0_CLIENT_ID &&
      environment.AUTH0_CLIENT_SECRET &&
      environment.AUTH0_SECRET &&
      (environment.APP_BASE_URL || environment.SITE_URL),
  );
}

export function safeReturnPath(value: string | undefined): string {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/admin";
  }
  try {
    const parsed = new URL(value, "https://ardas.invalid");
    return parsed.origin === "https://ardas.invalid" ? `${parsed.pathname}${parsed.search}` : "/admin";
  } catch {
    return "/admin";
  }
}

function createAuth0Client(cspNonce?: string): Auth0Client {
  return new Auth0Client({
    appBaseUrl: process.env.APP_BASE_URL ?? process.env.SITE_URL,
    authorizationParameters: { scope: "openid profile email" },
    signInReturnToPath: "/admin",
    logoutStrategy: "oidc",
    cspNonce,
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
}

export function getAuth0Client(cspNonce?: string): Auth0Client {
  if (!hasCompleteAuth0Configuration()) {
    throw new Error("Auth0 admin authentication is not configured.");
  }
  if (cspNonce) return createAuth0Client(cspNonce);
  auth0Client ??= createAuth0Client();
  return auth0Client;
}
