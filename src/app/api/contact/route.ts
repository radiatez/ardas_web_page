import { getRuntimeDatabase } from "@/db/runtime";
import { isLocale } from "@/i18n/config";
import { resolveSubmissionRuntimeConfiguration } from "@/forms/configuration";
import { localizeFieldErrors, PublicFormValidationError } from "@/forms/errors";
import {
  createSesNotificationSender,
  UnavailableSubmissionNotificationSender,
} from "@/forms/notifications";
import { parseContactRequestBody } from "@/forms/parsing";
import { persistContactSubmission } from "@/forms/submissions";
import { RateLimitExceededError, SecurityBoundaryError } from "@/security/errors";
import { securityLogger } from "@/security/logging";
import { guardPublicFormRequest } from "@/security/request-limits";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { db } = getRuntimeDatabase();
    const body = await guardPublicFormRequest(db, request, "contact");
    const raw = parseContactRequestBody(body);
    const locale = typeof raw.locale === "string" && isLocale(raw.locale) ? raw.locale : "tr";
    const configuration = await resolveSubmissionRuntimeConfiguration(
      db,
      "contact",
      locale,
    );
    if (!configuration) {
      return Response.json({ error: "contact_submission_not_enabled" }, { status: 503 });
    }
    let sender;
    try {
      sender = await createSesNotificationSender(db);
    } catch {
      sender = new UnavailableSubmissionNotificationSender();
    }
    const result = await persistContactSubmission(
      db,
      sender,
      raw,
      configuration,
    );
    return Response.json(
      {
        ok: true,
        duplicate: result.duplicate,
        message:
          locale === "tr"
            ? "Mesajınız güvenli şekilde alındı."
            : "Your message has been received securely.",
      },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof PublicFormValidationError) {
      const locale = request.headers.get("accept-language")?.toLowerCase().startsWith("en")
        ? "en"
        : "tr";
      return Response.json(
        {
          error: error.code,
          message:
            locale === "tr"
              ? "Formdaki alanları kontrol edin."
              : "Check the fields in the form.",
          fieldErrors: localizeFieldErrors(locale, error.fieldErrors),
        },
        { status: error.status },
      );
    }
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
    securityLogger.error("security.contact_submission_failed", { error });
    return Response.json({ error: "service_unavailable" }, { status: 503 });
  }
}
