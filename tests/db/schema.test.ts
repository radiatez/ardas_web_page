import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { siteSettingKeys } from "../../src/config/site-settings";
import { locales } from "../../src/i18n/config";
import { routeKeys } from "../../src/i18n/routes";
import {
  auditEvents,
  brandLocales,
  careerApplications,
  contactSubmissions,
  departmentLocales,
  departments,
  jobPostingLocales,
  localeEnum,
  locationLocales,
  media,
  mediaLocales,
  pageLocales,
  pages,
  productGroupLocales,
  publicationStatusEnum,
  routeKeyEnum,
  siteSettingKeyEnum,
  siteSettings,
  slugRedirects,
  storageClassEnum,
} from "../../src/db/schema";

const localizedTables = [
  pageLocales,
  brandLocales,
  productGroupLocales,
  locationLocales,
  departmentLocales,
  jobPostingLocales,
  mediaLocales,
] as const;

describe("Milestone 1 data model", () => {
  it("binds the database locale and route enums to the application registry", () => {
    expect(localeEnum.enumValues).toEqual(locales);
    expect(routeKeyEnum.enumValues).toEqual(routeKeys);
    expect(publicationStatusEnum.enumValues).toEqual([
      "draft",
      "published",
      "archived",
    ]);
  });

  it("gives every independently localized entity publication fields", () => {
    for (const table of localizedTables) {
      expect(table.locale.notNull).toBe(true);
      expect(table.publishStatus.notNull).toBe(true);
      expect(table.publishedAt).toBeDefined();
      expect(table.scheduledPublishAt).toBeDefined();
      expect(table.scheduledArchiveAt).toBeDefined();
    }
  });

  it("keeps stable page identity separate from localized slugs", () => {
    expect(getTableName(pages)).toBe("page");
    expect(pages.routeKey.notNull).toBe(true);
    expect(pageLocales.slug.notNull).toBe(true);
    expect(getTableName(slugRedirects)).toBe("slug_redirect");
    expect(slugRedirects.httpStatus.hasDefault).toBe(true);
  });

  it("models managed departments with localized publication", () => {
    expect(getTableName(departments)).toBe("department");
    expect(getTableName(departmentLocales)).toBe("department_locale");
    expect(departments.key.notNull).toBe(true);
  });

  it("keeps general applications independent from job postings", () => {
    expect(careerApplications.jobPostingId.notNull).toBe(false);
    expect(careerApplications.departmentId.notNull).toBe(true);
    expect(careerApplications.locationId.notNull).toBe(true);
    expect(careerApplications.cvFileId.notNull).toBe(true);
  });

  it("requires privacy provenance and a retention deadline on both forms", () => {
    for (const table of [careerApplications, contactSubmissions]) {
      expect(table.locale.notNull).toBe(true);
      expect(table.privacyNoticeVersion.notNull).toBe(true);
      expect(table.privacyNoticeShownAt.notNull).toBe(true);
      expect(table.privacyAcknowledgedAt.notNull).toBe(false);
      expect(table.retentionDueAt.notNull).toBe(true);
    }
  });

  it("separates public, protected and quarantine object states", () => {
    expect(getTableName(media)).toBe("media");
    expect(storageClassEnum.enumValues).toEqual([
      "public",
      "protected",
      "quarantine",
    ]);
    expect(media.storageClass.notNull).toBe(true);
  });

  it("limits CMS settings to non-secret configuration keys", () => {
    expect(getTableName(siteSettings)).toBe("site_setting");
    expect(siteSettingKeyEnum.enumValues).toEqual(siteSettingKeys);
    expect(siteSettingKeys.some((key) => /secret|token|password|api_key/.test(key))).toBe(
      false,
    );
  });

  it("provides the append-oriented audit foundation", () => {
    expect(getTableName(auditEvents)).toBe("audit_event");
    expect(auditEvents.eventType.notNull).toBe(true);
    expect(auditEvents.metadataRedacted.notNull).toBe(true);
    expect(auditEvents.createdAt.notNull).toBe(true);
  });
});
