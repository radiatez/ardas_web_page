import { createHmac } from "node:crypto";

import { sql } from "drizzle-orm";

import type { DatabaseClient } from "../db/client";
import { rateLimitBuckets } from "../db/schema";
import { RateLimitExceededError } from "./errors";

export interface RateLimitPolicy {
  route: string;
  limit: number;
  windowSeconds: number;
}

export function hashRateLimitIdentifier(
  identifier: string,
  secret: string,
): string {
  if (secret.length < 32) {
    throw new Error("RATE_LIMIT_HASH_SECRET must contain at least 32 characters.");
  }
  return createHmac("sha256", secret).update(identifier).digest("hex");
}

export async function enforceRateLimit(
  db: DatabaseClient,
  identifier: string,
  policy: RateLimitPolicy,
  options: { secret?: string; now?: Date } = {},
): Promise<void> {
  const secret = options.secret ?? process.env.RATE_LIMIT_HASH_SECRET;
  if (!secret) {
    throw new Error("RATE_LIMIT_HASH_SECRET is required.");
  }
  const now = options.now ?? new Date();
  const windowMilliseconds = policy.windowSeconds * 1000;
  const windowStartedAt = new Date(
    Math.floor(now.getTime() / windowMilliseconds) * windowMilliseconds,
  );
  const expiresAt = new Date(windowStartedAt.getTime() + windowMilliseconds * 2);
  const identifierHash = hashRateLimitIdentifier(identifier, secret);
  const [bucket] = await db
    .insert(rateLimitBuckets)
    .values({
      route: policy.route,
      identifierHash,
      windowStartedAt,
      requestCount: 1,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: [
        rateLimitBuckets.route,
        rateLimitBuckets.identifierHash,
        rateLimitBuckets.windowStartedAt,
      ],
      set: {
        requestCount: sql`${rateLimitBuckets.requestCount} + 1`,
      },
    })
    .returning({ requestCount: rateLimitBuckets.requestCount });

  if ((bucket?.requestCount ?? policy.limit + 1) > policy.limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil(
        (windowStartedAt.getTime() + windowMilliseconds - now.getTime()) / 1000,
      ),
    );
    throw new RateLimitExceededError(retryAfterSeconds);
  }
}

export function requestRateLimitIdentifier(request: Request): string {
  const forwarded =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unavailable";
  return forwarded.split(",")[0]?.trim() || "unavailable";
}
