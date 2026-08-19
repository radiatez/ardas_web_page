import { describe, expect, it } from "vitest";

import {
  assertContentLengthWithinLimit,
  assertJsonRequest,
  assertTrustedPublicFormOrigin,
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

  it("rejects invalid content types before parsing public JSON forms", () => {
    expect(() => assertJsonRequest(new Request("https://example.test/api/contact", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "{}",
    }))).toThrowError("unsupported_media_type");
    expect(() => assertJsonRequest(new Request("https://example.test/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: "{}",
    }))).not.toThrow();
  });

  it("enforces the configured same-origin boundary outside local/test", () => {
    const trusted = new Request("https://ardas.example/api/contact", {
      headers: { origin: "https://ardas.example" },
    });
    expect(() =>
      assertTrustedPublicFormOrigin(trusted, {
        APP_ENV: "production",
        APP_BASE_URL: "https://ardas.example",
        NODE_ENV: "production",
      } as NodeJS.ProcessEnv),
    ).not.toThrow();

    const untrusted = new Request("https://ardas.example/api/contact", {
      headers: { origin: "https://attacker.example" },
    });
    expect(() =>
      assertTrustedPublicFormOrigin(untrusted, {
        APP_ENV: "production",
        APP_BASE_URL: "https://ardas.example",
        NODE_ENV: "production",
      } as NodeJS.ProcessEnv),
    ).toThrowError("untrusted_origin");
  });
});
