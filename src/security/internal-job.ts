import { timingSafeEqual } from "node:crypto";

export function authorizeInternalJob(
  authorizationHeader: string | null,
  configuredSecret: string | undefined,
): boolean {
  if (!configuredSecret || configuredSecret.length < 32) {
    return false;
  }
  const expected = `Bearer ${configuredSecret}`;
  if (!authorizationHeader || authorizationHeader.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(authorizationHeader), Buffer.from(expected));
}
