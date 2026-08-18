export const siteSettingKeys = [
  "display_name",
  "company_stats",
  "contact_footer",
  "social_links",
  "default_seo",
  "dealer_portal_url",
  "candidate_retention_days",
  "contact_retention_days",
  "audit_retention_days",
  "contact_notification_recipient",
  "hr_notification_recipient",
  "content_owner_metadata",
] as const;

export type SiteSettingKey = (typeof siteSettingKeys)[number];

export function isSiteSettingKey(value: string): value is SiteSettingKey {
  return siteSettingKeys.some((key) => key === value);
}
