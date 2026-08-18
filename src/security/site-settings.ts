import type { SiteSettingKey } from "../config/site-settings";
import type { DatabaseClient } from "../db/client";
import { siteSettings } from "../db/schema";
import { appendAuditEvent } from "./audit";
import { InvalidSecurityInputError } from "./errors";
import {
  assertAuthorized,
  type AdminPrincipal,
} from "./rbac/authorization";

const editableContentSettingKeys = [
  "display_name",
  "company_stats",
  "contact_footer",
  "social_links",
  "default_seo",
  "content_owner_metadata",
] as const satisfies readonly SiteSettingKey[];

type EditableContentSettingKey = (typeof editableContentSettingKeys)[number];

function isEditableContentSettingKey(
  value: SiteSettingKey,
): value is EditableContentSettingKey {
  return editableContentSettingKeys.some((key) => key === value);
}

export async function updateGeneralSiteSetting(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  key: SiteSettingKey,
  value: unknown,
) {
  assertAuthorized(principal, {
    permission: "SiteSettings:edit-general",
    scope: "content",
    environment: process.env.APP_ENV,
  });
  if (!isEditableContentSettingKey(key)) {
    throw new InvalidSecurityInputError("site_setting_not_general_editable");
  }
  const now = new Date();
  await db.transaction(async (transaction) => {
    await transaction
      .insert(siteSettings)
      .values({ key, typedValue: value, updatedBy: principal.userId, updatedAt: now })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { typedValue: value, updatedBy: principal.userId, updatedAt: now },
      });
    await appendAuditEvent(transaction, {
      actorUserId: principal.userId,
      eventType: "content.site_setting_updated",
      resourceType: "site_setting",
      metadata: { settingKey: key },
    });
  });
}
