import { describe, expect, it } from "vitest";

import {
  createCvStorageKey,
  CV_MAX_SIZE_BYTES,
  validateCvUpload,
} from "../../src/security/cv/validation";

const validPdf = new TextEncoder().encode("%PDF-1.7\n1 0 obj\n%%EOF\n");

describe("CV validation", () => {
  it("accepts a bounded PDF with matching extension, MIME and signature", () => {
    expect(() =>
      validateCvUpload({
        originalFilename: "candidate.pdf",
        mimeType: "application/pdf",
        bytes: validPdf,
      }),
    ).not.toThrow();
  });

  it("rejects non-PDF extension and MIME", () => {
    expect(() =>
      validateCvUpload({
        originalFilename: "candidate.exe",
        mimeType: "application/pdf",
        bytes: validPdf,
      }),
    ).toThrowError("cv_extension_not_allowed");
    expect(() =>
      validateCvUpload({
        originalFilename: "candidate.pdf",
        mimeType: "application/octet-stream",
        bytes: validPdf,
      }),
    ).toThrowError("cv_mime_not_allowed");
  });

  it("rejects over-10MB and signature/EOF mismatches", () => {
    expect(() =>
      validateCvUpload({
        originalFilename: "candidate.pdf",
        mimeType: "application/pdf",
        bytes: new Uint8Array(CV_MAX_SIZE_BYTES + 1),
      }),
    ).toThrowError("cv_size_not_allowed");
    for (const bytes of [
      new TextEncoder().encode("MZ%PDF-1.7\n%%EOF"),
      new TextEncoder().encode("%PDF-1.7\nno eof"),
    ]) {
      expect(() =>
        validateCvUpload({
          originalFilename: "candidate.pdf",
          mimeType: "application/pdf",
          bytes,
        }),
      ).toThrowError("cv_pdf_signature_invalid");
    }
  });

  it("never derives the storage key from the supplied filename", () => {
    const key = createCvStorageKey(new Date("2026-08-18T00:00:00Z"));
    expect(key).toMatch(
      /^cv\/2026\/08\/[0-9a-f]{8}-[0-9a-f-]{27}\.pdf$/,
    );
    expect(key).not.toContain("candidate");
  });
});
