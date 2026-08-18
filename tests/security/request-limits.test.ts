import { describe, expect, it } from "vitest";

import {
  assertContentLengthWithinLimit,
  readRequestBodyWithinLimit,
} from "../../src/security/request-limits";

describe("public form request-size limits", () => {
  it("rejects an oversized declared body", () => {
    const request = new Request("https://example.test/api/contact", {
      method: "POST",
      headers: { "content-length": "101" },
      body: "small",
    });
    expect(() => assertContentLengthWithinLimit(request, 100)).toThrowError(
      "request_too_large",
    );
  });

  it("stops a streamed body that exceeds the limit", async () => {
    const request = new Request("https://example.test/api/contact", {
      method: "POST",
      body: new Uint8Array(101),
    });
    await expect(readRequestBodyWithinLimit(request, 100)).rejects.toThrowError(
      "request_too_large",
    );
  });
});
