import { readAdminJson } from "@/admin/http";
import { adminApiError, resolveRequestAdminPrincipal } from "@/admin/request-access";
import { isSiteSettingKey } from "@/config/site-settings";
import { getRuntimeDatabase } from "@/db/runtime";
import { updateDealerPortalUrl } from "@/security/dealer-portal";
import { InvalidSecurityInputError } from "@/security/errors";
import { updateGeneralSiteSetting } from "@/security/site-settings";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const [body, principal] = await Promise.all([readAdminJson(request, 64 * 1024), resolveRequestAdminPrincipal()]);
    const key = String(body.key ?? "");
    if (!isSiteSettingKey(key)) throw new InvalidSecurityInputError("site_setting_key_invalid");
    const { db } = getRuntimeDatabase();
    if (key === "dealer_portal_url") {
      return Response.json({ value: await updateDealerPortalUrl(db, principal, String(body.value ?? "")) });
    }
    await updateGeneralSiteSetting(db, principal, key, body.value);
    return Response.json({ key, updated: true });
  } catch (error) {
    return adminApiError(error);
  }
}
