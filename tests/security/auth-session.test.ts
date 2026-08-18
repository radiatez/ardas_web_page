import type { SessionData } from "@auth0/nextjs-auth0/types";
import { describe, expect, it } from "vitest";

import { sessionUsedMfa } from "../../src/auth/admin-access";

function session(amr?: unknown): SessionData {
  return {
    user: { sub: "auth0|test", amr },
    tokenSet: { accessToken: "test", expiresAt: 1 },
    internal: { sid: "test", createdAt: 1 },
  };
}

describe("Auth0 admin session", () => {
  it("accepts only the standard MFA authentication-method reference", () => {
    expect(sessionUsedMfa(session(["pwd", "mfa"]))).toBe(true);
    expect(sessionUsedMfa(session(["pwd"]))).toBe(false);
    expect(sessionUsedMfa(session(undefined))).toBe(false);
    expect(sessionUsedMfa(session("mfa"))).toBe(false);
  });
});
