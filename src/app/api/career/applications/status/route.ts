import { getRuntimeDatabase } from "@/db/runtime";
import { isLocale, type Locale } from "@/i18n/config";
import { resolvePublicCareerScanStatus } from "@/forms/status";
import { RateLimitExceededError, SecurityBoundaryError } from "@/security/errors";
import { securityLogger } from "@/security/logging";
import { guardPublicFormRequest } from "@/security/request-limits";

export const runtime = "nodejs";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function localizedMessage(locale: Locale, status: "clean" | "infected" | "processing") {
  if (status === "clean") {
    return locale === "tr"
      ? "Başvurunuz ve CV güvenlik kontrolü başarıyla tamamlandı."
      : "Your application and CV security scan were completed successfully.";
  }
  if (status === "infected") {
    return locale === "tr"
      ? "CV dosyası güvenlik kontrolünden geçemedi ve erişime açılmadı. Lütfen sayfayı yenileyip güvenli bir PDF ile yeniden başvurun."
      : "The CV did not pass the security scan and was not made accessible. Refresh the page and apply again with a safe PDF.";
  }
  return locale === "tr"
    ? "CV güvenlik kontrolü devam ediyor; dosya erişime kapalıdır."
    : "The CV security scan is still processing; the file remains inaccessible.";
}

export async function POST(request: Request) {
  try {
    const { db } = getRuntimeDatabase();
    const bytes = await guardPublicFormRequest(db, request, "careerStatus");
    let body: unknown;
    try {
      body = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
    } catch {
      return Response.json({ error: "invalid_request" }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ error: "invalid_request" }, { status: 400 });
    }
    const record = body as Record<string, unknown>;
    if (
      Object.keys(record).some((key) => key !== "submission_id" && key !== "locale") ||
      typeof record.submission_id !== "string" ||
      !uuidPattern.test(record.submission_id) ||
      typeof record.locale !== "string" ||
      !isLocale(record.locale)
    ) {
      return Response.json({ error: "invalid_request" }, { status: 400 });
    }

    const status = await resolvePublicCareerScanStatus(db, record.submission_id);
    if (status === "missing") {
      return Response.json({ error: "resource_not_found" }, { status: 404 });
    }
    return Response.json(
      { status, message: localizedMessage(record.locale, status) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof SecurityBoundaryError) {
      const headers =
        error instanceof RateLimitExceededError
          ? { "Retry-After": String(error.retryAfterSeconds) }
          : undefined;
      return Response.json({ error: error.code }, { status: error.status, headers });
    }
    securityLogger.error("security.career_scan_status_failed", { error });
    return Response.json({ error: "service_unavailable" }, { status: 503 });
  }
}
