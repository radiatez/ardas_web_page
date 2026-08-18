import { getRuntimeDatabase } from "@/db/runtime";
import { RateLimitExceededError, SecurityBoundaryError } from "@/security/errors";
import { securityLogger } from "@/security/logging";
import { guardPublicFormRequest } from "@/security/request-limits";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await guardPublicFormRequest(
      getRuntimeDatabase().db,
      request,
      "career",
    );
    return Response.json(
      { error: "career_submission_not_enabled" },
      { status: 503 },
    );
  } catch (error) {
    if (error instanceof SecurityBoundaryError) {
      const headers =
        error instanceof RateLimitExceededError
          ? { "Retry-After": String(error.retryAfterSeconds) }
          : undefined;
      return Response.json(
        { error: error.code },
        { status: error.status, headers },
      );
    }
    securityLogger.error("security.career_request_guard_failed", { error });
    return Response.json({ error: "service_unavailable" }, { status: 503 });
  }
}
