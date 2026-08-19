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

function validateGeneralSettingValue(key: EditableContentSettingKey, value: unknown) {
  if (key === "display_name") {
    if (typeof value !== "string" || !value.trim() || value.trim().length > 160) {
      throw new InvalidSecurityInputError("site_setting_value_invalid");
    }
    return value.trim();
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InvalidSecurityInputError("site_setting_value_invalid");
  }
  const serialized = JSON.stringify(value);
  if (serialized.length > 32_000 || /"[^"\n]*(?:secret|password|token|credential|api.?key)[^"\n]*"\s*:/i.test(serialized)) {
    throw new InvalidSecurityInputError("site_setting_value_invalid");
  }
  return value;
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
  const validatedValue = validateGeneralSettingValue(key, value);
  const now = new Date();
  await db.transaction(async (transaction) => {
    await transaction
      .insert(siteSettings)
      .values({ key, typedValue: validatedValue, updatedBy: principal.userId, updatedAt: now })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { typedValue: validatedValue, updatedBy: principal.userId, updatedAt: now },
      });
    await appendAuditEvent(transaction, {
      actorUserId: principal.userId,
      eventType: "content.site_setting_updated",
      resourceType: "site_setting",
      metadata: { settingKey: key },
    });
  });
}
