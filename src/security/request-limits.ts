import type { DatabaseClient } from "../db/client";
import { RequestTooLargeError } from "./errors";
import {
  enforceRateLimit,
  requestRateLimitIdentifier,
  type RateLimitPolicy,
} from "./rate-limit";
import { CV_MAX_SIZE_BYTES } from "./cv/validation";

export const publicFormLimits = {
  career: {
    maxRequestBytes: CV_MAX_SIZE_BYTES + 512 * 1024,
    rate: { route: "career", limit: 5, windowSeconds: 15 * 60 },
  },
  contact: {
    maxRequestBytes: 64 * 1024,
    rate: { route: "contact", limit: 10, windowSeconds: 15 * 60 },
  },
} as const satisfies Record<
  "career" | "contact",
  { maxRequestBytes: number; rate: RateLimitPolicy }
>;

export function assertContentLengthWithinLimit(
  request: Request,
  maxBytes: number,
): void {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) {
    return;
  }
  const parsed = Number(contentLength);
  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > maxBytes) {
    throw new RequestTooLargeError();
  }
}

export async function readRequestBodyWithinLimit(
  request: Request,
  maxBytes: number,
): Promise<Uint8Array> {
  assertContentLengthWithinLimit(request, maxBytes);
  if (!request.body) {
    return new Uint8Array();
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new RequestTooLargeError();
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export async function guardPublicFormRequest(
  db: DatabaseClient,
  request: Request,
  form: "career" | "contact",
): Promise<Uint8Array> {
  const limits = publicFormLimits[form];
  assertContentLengthWithinLimit(request, limits.maxRequestBytes);
  await enforceRateLimit(db, requestRateLimitIdentifier(request), limits.rate);
  return readRequestBodyWithinLimit(request, limits.maxRequestBytes);
}
