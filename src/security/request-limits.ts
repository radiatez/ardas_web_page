import type { DatabaseClient } from "../db/client";
import { RequestTooLargeError, SecurityBoundaryError } from "./errors";
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
  careerStatus: {
    maxRequestBytes: 2 * 1024,
    rate: { route: "career-status", limit: 30, windowSeconds: 15 * 60 },
  },
} as const satisfies Record<
  "career" | "careerStatus" | "contact",
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
  form: "career" | "careerStatus" | "contact",
): Promise<Uint8Array> {
  const limits = publicFormLimits[form];
  assertContentLengthWithinLimit(request, limits.maxRequestBytes);
  assertTrustedPublicFormOrigin(request);
  await enforceRateLimit(db, requestRateLimitIdentifier(request), limits.rate);
  return readRequestBodyWithinLimit(request, limits.maxRequestBytes);
}

export function assertTrustedPublicFormOrigin(
  request: Request,
  environment: NodeJS.ProcessEnv = process.env,
): void {
  const origin = request.headers.get("origin");
  const configuredBase = environment.APP_BASE_URL ?? environment.SITE_URL;
  const localOrTest =
    environment.APP_ENV === "local" ||
    environment.APP_ENV === "test" ||
    (!environment.APP_ENV && environment.NODE_ENV !== "production");
  if (!origin && localOrTest) return;
  if (!origin || !configuredBase) {
    throw new SecurityBoundaryError("untrusted_origin", 403);
  }
  try {
    if (new URL(origin).origin !== new URL(configuredBase).origin) {
      throw new SecurityBoundaryError("untrusted_origin", 403);
    }
  } catch (error) {
    if (error instanceof SecurityBoundaryError) throw error;
    throw new SecurityBoundaryError("untrusted_origin", 403);
  }
}
