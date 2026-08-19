import { getRuntimeDatabase } from "@/db/runtime";
import { isLocale } from "@/i18n/config";
import { resolveSubmissionRuntimeConfiguration } from "@/forms/configuration";
import { localizeFieldErrors, PublicFormValidationError } from "@/forms/errors";
import {
  createSesNotificationSender,
  UnavailableSubmissionNotificationSender,
} from "@/forms/notifications";
import { parseCareerRequestBody } from "@/forms/parsing";
import { persistCareerSubmission } from "@/forms/submissions";
import { S3CvObjectStorage } from "@/security/cv/storage";
import { RateLimitExceededError, SecurityBoundaryError } from "@/security/errors";
import { securityLogger } from "@/security/logging";
import { guardPublicFormRequest } from "@/security/request-limits";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { db } = getRuntimeDatabase();
    const body = await guardPublicFormRequest(db, request, "career");
    const parsed = await parseCareerRequestBody(
      body,
      request.headers.get("content-type"),
    );
    const locale =
      typeof parsed.raw.locale === "string" && isLocale(parsed.raw.locale)
        ? parsed.raw.locale
        : "tr";
    const configuration = await resolveSubmissionRuntimeConfiguration(
      db,
      "career",
      locale,
    );
    if (!configuration) {
      return Response.json({ error: "career_submission_not_enabled" }, { status: 503 });
    }
    let sender;
    try {
      sender = await createSesNotificationSender(db);
    } catch {
      sender = new UnavailableSubmissionNotificationSender();
    }
    const result = await persistCareerSubmission(
      db,
      S3CvObjectStorage.fromEnvironment(),
      sender,
      parsed.raw,
      {
        originalFilename: parsed.cv.name,
        mimeType: parsed.cv.type,
        bytes: new Uint8Array(await parsed.cv.arrayBuffer()),
      },
      configuration,
    );
    return Response.json(
      {
        ok: true,
        duplicate: result.duplicate,
        status: "processing",
        statusUrl: "/api/career/applications/status",
        message:
          locale === "tr"
            ? "Başvurunuz alındı. CV güvenlik kontrolü tamamlanana kadar dosyanız erişime kapalıdır."
            : "Your application was received. Your CV remains inaccessible until the security scan is complete.",
      },
      { status: 202 },
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
      const locale = request.headers.get("accept-language")?.toLowerCase().startsWith("en")
        ? "en"
        : "tr";
      const cvValidationCodes = new Set([
        "cv_extension_not_allowed",
        "cv_mime_not_allowed",
        "cv_size_not_allowed",
        "cv_pdf_signature_invalid",
      ]);
      if (cvValidationCodes.has(error.code)) {
        const message =
          error.code === "cv_size_not_allowed"
            ? locale === "tr"
              ? "CV dosyası en fazla 10 MB olabilir."
              : "The CV file may be at most 10 MB."
            : locale === "tr"
              ? "CV yalnızca geçerli bir PDF dosyası olarak yüklenebilir."
              : "The CV must be uploaded as a valid PDF file.";
        return Response.json(
          { error: "cv_invalid", message, fieldErrors: { cv: message } },
          { status: error.status },
        );
      }
      const headers =
        error instanceof RateLimitExceededError
          ? { "Retry-After": String(error.retryAfterSeconds) }
          : undefined;
      return Response.json(
        { error: error.code },
        { status: error.status, headers },
      );
    }
    securityLogger.error("security.career_submission_failed", { error });
    return Response.json({ error: "service_unavailable" }, { status: 503 });
  }
}
