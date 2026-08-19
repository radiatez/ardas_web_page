import { describe, expect, it } from "vitest";

import { securityHeaders } from "../../next.config";
import {
  buildContentSecurityPolicy,
  createCspNonce,
  isPrivateApplicationPath,
} from "../../src/security/csp";

describe("production security headers", () => {
  it("includes the required web-security baseline", () => {
    const headers = Object.fromEntries(
      securityHeaders.map(({ key, value }) => [key, value]),
    );
    expect(headers["Strict-Transport-Security"]).toContain("max-age=");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
    expect(headers).not.toHaveProperty("Content-Security-Policy");
  });

  it("builds a per-request strict production CSP without inline/eval escapes", () => {
    const policy = buildContentSecurityPolicy("testNonce123=", {
      APP_ENV: "production",
      PUBLIC_MEDIA_BASE_URL: "https://media.example.test/public",
    });
    expect(policy).toContain("script-src 'self' 'nonce-testNonce123=' 'strict-dynamic'");
    expect(policy).toContain("style-src 'self' 'nonce-testNonce123='");
    expect(policy).toContain("script-src-attr 'none'");
    expect(policy).toContain("style-src-attr 'unsafe-hashes' 'sha256-");
    expect(policy).toContain("img-src 'self' data: https://media.example.test");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).toContain("upgrade-insecure-requests");
    expect(policy).not.toContain("unsafe-inline");
    expect(policy).not.toContain("unsafe-eval");
    expect(policy).not.toMatch(/(?:^|\s)https:(?:\s|;|$)/);
  });

  it("does not weaken the media policy for malformed configuration", () => {
    const policy = buildContentSecurityPolicy("nonce", {
      APP_ENV: "test",
      PUBLIC_MEDIA_BASE_URL: "http://media.example.test/public",
    });
    expect(policy).toContain("img-src 'self' data:");
    expect(policy).not.toContain("media.example.test");
    expect(policy).not.toContain("upgrade-insecure-requests");
  });

  it("generates CSP-safe nonces and marks private surfaces no-store eligible", () => {
    expect(createCspNonce()).toMatch(/^[A-Za-z0-9+/=]+$/);
    for (const path of ["/admin", "/preview/home/tr", "/auth/login", "/api/contact", "/e2e-test-surface/admin-ui"]) {
      expect(isPrivateApplicationPath(path), path).toBe(true);
    }
    expect(isPrivateApplicationPath("/tr/kurumsal")).toBe(false);
  });
});
