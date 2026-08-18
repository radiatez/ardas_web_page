import { describe, expect, it } from "vitest";

import { validateDealerPortalUrl } from "../../src/security/dealer-portal";

describe("Dealer Portal URL validation", () => {
  it("accepts only HTTPS URLs on an optional allowlist", () => {
    expect(
      validateDealerPortalUrl("https://online.bsdotomotiv.com/web", [
        "online.bsdotomotiv.com",
      ]),
    ).toBe("https://online.bsdotomotiv.com/web");
    expect(() =>
      validateDealerPortalUrl("http://online.bsdotomotiv.com/web"),
    ).toThrowError("dealer_portal_url_invalid");
    expect(() =>
      validateDealerPortalUrl("https://evil.example/web", [
        "online.bsdotomotiv.com",
      ]),
    ).toThrowError("dealer_portal_host_not_allowed");
  });

  it("rejects credential, query, fragment and non-standard-port payloads", () => {
    for (const url of [
      "https://user:pass@example.com/web",
      "https://example.com/web?token=secret",
      "https://example.com/web#next",
      "https://example.com:8443/web",
    ]) {
      expect(() => validateDealerPortalUrl(url)).toThrowError(
        "dealer_portal_url_invalid",
      );
    }
  });
});
