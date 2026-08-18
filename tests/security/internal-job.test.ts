import { describe, expect, it } from "vitest";

import { authorizeInternalJob } from "../../src/security/internal-job";

describe("internal security jobs", () => {
  const secret = "0123456789abcdef0123456789abcdef";

  it("requires an exact bearer secret and fails closed on bad configuration", () => {
    expect(authorizeInternalJob(`Bearer ${secret}`, secret)).toBe(true);
    expect(authorizeInternalJob("Bearer wrong", secret)).toBe(false);
    expect(authorizeInternalJob(null, secret)).toBe(false);
    expect(authorizeInternalJob(`Bearer ${secret}`, "short")).toBe(false);
    expect(authorizeInternalJob(`Bearer ${secret}`, undefined)).toBe(false);
  });
});
