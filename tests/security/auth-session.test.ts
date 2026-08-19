import type { SessionData } from "@auth0/nextjs-auth0/types";
import { describe, expect, it } from "vitest";

import { sessionUsedMfa } from "../../src/auth/admin-access";
import { hasCompleteAuth0Configuration, safeReturnPath } from "../../src/auth/auth0";

function session(amr?: unknown): SessionData {
  return {
    user: { sub: "auth0|test", amr },
    tokenSet: { accessToken: "test", expiresAt: 1 },
    internal: { sid: "test", createdAt: 1 },
  };
}

describe("Auth0 admin session", () => {
  it("fails the admin boundary closed until every server setting exists", () => {
    expect(hasCompleteAuth0Configuration({})).toBe(false);
    expect(
      hasCompleteAuth0Configuration({
        AUTH0_DOMAIN: "tenant.eu.auth0.com",
        AUTH0_CLIENT_ID: "client",
        AUTH0_CLIENT_SECRET: "client-secret",
        AUTH0_SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        APP_BASE_URL: "https://example.test",
      }),
    ).toBe(true);
  });

  it("accepts only the standard MFA authentication-method reference", () => {
    expect(sessionUsedMfa(session(["pwd", "mfa"]))).toBe(true);
    expect(sessionUsedMfa(session(["pwd"]))).toBe(false);
    expect(sessionUsedMfa(session(undefined))).toBe(false);
    expect(sessionUsedMfa(session("mfa"))).toBe(false);
  });

  it("prevents callback open redirects and keeps local admin return paths", () => {
    expect(safeReturnPath("/admin/basvurular?page=2")).toBe(
      "/admin/basvurular?page=2",
    );
    for (const unsafe of [
      "https://attacker.example",
      "//attacker.example/path",
      "/\\attacker.example/path",
      "\\attacker.example",
      undefined,
    ]) {
      expect(safeReturnPath(unsafe)).toBe("/admin");
    }
  });
});
