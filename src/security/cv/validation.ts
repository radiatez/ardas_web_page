import { randomUUID } from "node:crypto";

import { InvalidSecurityInputError } from "../errors";

export const CV_MAX_SIZE_BYTES = 10 * 1024 * 1024;
export const CV_MIME_TYPE = "application/pdf";

export interface CvUploadInput {
  originalFilename: string;
  mimeType: string;
  bytes: Uint8Array;
}

function hasPdfHeader(bytes: Uint8Array): boolean {
  if (bytes.length < 8) {
    return false;
  }
  const header = new TextDecoder("ascii").decode(bytes.subarray(0, 8));
  return /^%PDF-(?:1\.[0-9]|2\.0)/.test(header);
}

function hasPdfEof(bytes: Uint8Array): boolean {
  const tailStart = Math.max(0, bytes.length - 2048);
  const tail = new TextDecoder("ascii").decode(bytes.subarray(tailStart));
  return tail.includes("%%EOF");
}

export function validateCvUpload(input: CvUploadInput): void {
  const filename = input.originalFilename.trim();
  if (!filename || filename.length > 255 || !filename.toLowerCase().endsWith(".pdf")) {
    throw new InvalidSecurityInputError("cv_extension_not_allowed");
  }

  if (input.mimeType.trim().toLowerCase() !== CV_MIME_TYPE) {
    throw new InvalidSecurityInputError("cv_mime_not_allowed");
  }

  if (input.bytes.byteLength === 0 || input.bytes.byteLength > CV_MAX_SIZE_BYTES) {
    throw new InvalidSecurityInputError("cv_size_not_allowed");
  }

  if (!hasPdfHeader(input.bytes) || !hasPdfEof(input.bytes)) {
    throw new InvalidSecurityInputError("cv_pdf_signature_invalid");
  }
}

export function createCvStorageKey(now = new Date()): string {
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `cv/${year}/${month}/${randomUUID()}.pdf`;
}
