import { adminApiError, resolveRequestAdminPrincipal } from "@/admin/request-access";
import { readAdminJson } from "@/admin/http";
import { rollbackPageRevision, savePageDraft, transitionPagePublication } from "@/admin/cms";
import { publicPageRouteKeys, type PublicPageRouteKey } from "@/content/public-pages";
import { getRuntimeDatabase } from "@/db/runtime";
import { isLocale } from "@/i18n/config";
import { InvalidSecurityInputError } from "@/security/errors";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ routeKey: string; locale: string }> }) {
  try {
    const [{ routeKey: rawRouteKey, locale: rawLocale }, body, principal] = await Promise.all([
      context.params,
      readAdminJson(request),
      resolveRequestAdminPrincipal(),
    ]);
    if (!publicPageRouteKeys.includes(rawRouteKey as PublicPageRouteKey) || !isLocale(rawLocale)) {
      throw new InvalidSecurityInputError("content_route_or_locale_invalid");
    }
    const routeKey = rawRouteKey as PublicPageRouteKey;
    const { db } = getRuntimeDatabase();
    if (body.action === "save") {
      const result = await savePageDraft(db, principal, {
        routeKey,
        locale: rawLocale,
        title: String(body.title ?? ""),
        content: body.content && typeof body.content === "object" && !Array.isArray(body.content)
          ? body.content as Record<string, unknown> : {},
        seoTitle: typeof body.seoTitle === "string" ? body.seoTitle : null,
        seoDescription: typeof body.seoDescription === "string" ? body.seoDescription : null,
        ogTitle: typeof body.ogTitle === "string" ? body.ogTitle : null,
        ogDescription: typeof body.ogDescription === "string" ? body.ogDescription : null,
        ogMediaId: typeof body.ogMediaId === "string" ? body.ogMediaId : null,
        allowIndexing: body.allowIndexing !== false,
      });
      return Response.json(result);
    }
    if (body.action === "rollback") {
      const revisionNo = Number(body.revisionNo);
      if (!Number.isSafeInteger(revisionNo) || revisionNo < 1) throw new InvalidSecurityInputError("revision_number_invalid");
      return Response.json(await rollbackPageRevision(db, principal, { routeKey, locale: rawLocale, revisionNo }));
    }
    const allowed = ["publish", "schedule", "archive", "schedule-archive"] as const;
    if (!allowed.includes(body.action as (typeof allowed)[number])) throw new InvalidSecurityInputError("publication_action_invalid");
    const scheduledAt = typeof body.scheduledAt === "string" ? new Date(body.scheduledAt) : undefined;
    if (scheduledAt && Number.isNaN(scheduledAt.getTime())) throw new InvalidSecurityInputError("content_schedule_invalid");
    return Response.json(await transitionPagePublication(db, principal, {
      routeKey,
      locale: rawLocale,
      action: body.action as (typeof allowed)[number],
      scheduledAt,
    }));
  } catch (error) {
    return adminApiError(error);
  }
}
