import { describe, expect, it } from "vitest";

import { securityHeaders } from "../../next.config";

describe("production security headers", () => {
  it("includes the required web-security baseline", () => {
    const headers = Object.fromEntries(
      securityHeaders.map(({ key, value }) => [key, value]),
    );
    expect(headers["Strict-Transport-Security"]).toContain("max-age=");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(headers["Content-Security-Policy"]).toContain("object-src 'none'");
  });
});
