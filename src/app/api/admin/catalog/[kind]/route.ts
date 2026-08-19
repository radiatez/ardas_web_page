import { adminCatalogKinds, publishAdminCatalogItem, saveAdminCatalogItem,
  type AdminCatalogKind } from "@/admin/catalog";
import { readAdminJson } from "@/admin/http";
import { adminApiError, resolveRequestAdminPrincipal } from "@/admin/request-access";
import { getRuntimeDatabase } from "@/db/runtime";
import { isLocale } from "@/i18n/config";
import { InvalidSecurityInputError } from "@/security/errors";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ kind: string }> }) {
  try {
    const [{ kind: rawKind }, body, principal] = await Promise.all([context.params, readAdminJson(request), resolveRequestAdminPrincipal()]);
    if (!adminCatalogKinds.includes(rawKind as AdminCatalogKind) || !isLocale(String(body.locale))) {
      throw new InvalidSecurityInputError("catalog_kind_or_locale_invalid");
    }
    const kind = rawKind as AdminCatalogKind;
    const locale = String(body.locale) as "tr" | "en";
    const { db } = getRuntimeDatabase();
    if (body.action === "publish" || body.action === "archive") {
      return Response.json(await publishAdminCatalogItem(db, principal, kind, String(body.id ?? ""), locale, body.action));
    }
    if (body.action !== "save") throw new InvalidSecurityInputError("catalog_action_invalid");
    return Response.json(await saveAdminCatalogItem(db, principal, kind, {
      id: typeof body.id === "string" && body.id ? body.id : undefined,
      locale,
      key: typeof body.key === "string" ? body.key : undefined,
      name: String(body.name ?? ""),
      description: typeof body.description === "string" ? body.description : null,
      workingHours: typeof body.workingHours === "string" ? body.workingHours : null,
      slug: typeof body.slug === "string" ? body.slug : null,
      featured: body.featured === true,
      sortOrder: Number(body.sortOrder ?? 0),
      status: body.status === "inactive" || body.status === "archived" ? body.status : "active",
      mediaId: typeof body.mediaId === "string" && body.mediaId ? body.mediaId : null,
      addressData: body.addressData && typeof body.addressData === "object" && !Array.isArray(body.addressData)
        ? body.addressData as Record<string, unknown> : null,
      contactData: body.contactData && typeof body.contactData === "object" && !Array.isArray(body.contactData)
        ? body.contactData as Record<string, unknown> : null,
    }));
  } catch (error) {
    return adminApiError(error);
  }
}
