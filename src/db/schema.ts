import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { siteSettingKeys } from "../config/site-settings";
import { locales } from "../i18n/config";
import { routeKeys } from "../i18n/routes";

export const localeEnum = pgEnum("locale", locales);
export const routeKeyEnum = pgEnum("route_key", routeKeys);
export const publicationStatusEnum = pgEnum("publication_status", [
  "draft",
  "published",
  "archived",
]);
export const recordStatusEnum = pgEnum("record_status", [
  "active",
  "inactive",
  "archived",
]);
export const adminUserStatusEnum = pgEnum("admin_user_status", [
  "invited",
  "active",
  "disabled",
]);
export const applicationStatusEnum = pgEnum("application_status", [
  "new",
  "in_review",
  "interview",
  "rejected",
  "hired",
  "archived",
]);
export const contactStatusEnum = pgEnum("contact_status", [
  "new",
  "read",
  "replied",
  "archived",
]);
export const storageClassEnum = pgEnum("storage_class", [
  "public",
  "protected",
  "quarantine",
]);
export const malwareScanStatusEnum = pgEnum("malware_scan_status", [
  "pending",
  "clean",
  "infected",
  "error",
]);
export const siteSettingKeyEnum = pgEnum("site_setting_key", siteSettingKeys);

const publicationColumns = () => ({
  publishStatus: publicationStatusEnum("publish_status")
    .default("draft")
    .notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  scheduledPublishAt: timestamp("scheduled_publish_at", {
    withTimezone: true,
  }),
  scheduledArchiveAt: timestamp("scheduled_archive_at", {
    withTimezone: true,
  }),
});

export const adminUsers = pgTable(
  "admin_user",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    displayName: varchar("display_name", { length: 160 }).notNull(),
    status: adminUserStatusEnum("status").default("invited").notNull(),
    mfaEnrolledAt: timestamp("mfa_enrolled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("admin_user_email_unique").on(table.email)],
);

export const roles = pgTable(
  "role",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: varchar("key", { length: 80 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
  },
  (table) => [uniqueIndex("role_key_unique").on(table.key)],
);

export const permissions = pgTable(
  "permission",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: varchar("key", { length: 120 }).notNull(),
    resource: varchar("resource", { length: 80 }).notNull(),
    action: varchar("action", { length: 80 }).notNull(),
  },
  (table) => [
    uniqueIndex("permission_key_unique").on(table.key),
    uniqueIndex("permission_resource_action_unique").on(
      table.resource,
      table.action,
    ),
  ],
);

export const userRoles = pgTable(
  "user_role",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.roleId],
      name: "user_role_primary_key",
    }),
  ],
);

export const rolePermissions = pgTable(
  "role_permission",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      columns: [table.roleId, table.permissionId],
      name: "role_permission_primary_key",
    }),
  ],
);

export const media = pgTable(
  "media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storageClass: storageClassEnum("storage_class").notNull(),
    storageKey: text("storage_key").notNull(),
    originalFilename: varchar("original_filename", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 160 }).notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    width: integer("width"),
    height: integer("height"),
    focalX: real("focal_x"),
    focalY: real("focal_y"),
    scanStatus: malwareScanStatusEnum("scan_status"),
    scanCompletedAt: timestamp("scan_completed_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => adminUsers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("media_storage_key_unique").on(table.storageKey),
    index("media_storage_scan_idx").on(table.storageClass, table.scanStatus),
    check("media_size_positive", sql`${table.sizeBytes} > 0`),
    check(
      "media_protected_requires_clean_scan",
      sql`${table.storageClass} <> 'protected' OR ${table.scanStatus} = 'clean'`,
    ),
    check(
      "media_focal_x_range",
      sql`${table.focalX} IS NULL OR (${table.focalX} >= 0 AND ${table.focalX} <= 1)`,
    ),
    check(
      "media_focal_y_range",
      sql`${table.focalY} IS NULL OR (${table.focalY} >= 0 AND ${table.focalY} <= 1)`,
    ),
  ],
);

export const mediaLocales = pgTable(
  "media_locale",
  {
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    altText: text("alt_text"),
    caption: text("caption"),
    ...publicationColumns(),
  },
  (table) => [
    primaryKey({
      columns: [table.mediaId, table.locale],
      name: "media_locale_primary_key",
    }),
  ],
);

export const pages = pgTable(
  "page",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    routeKey: routeKeyEnum("route_key").notNull(),
    templateKey: varchar("template_key", { length: 80 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("page_route_key_unique").on(table.routeKey)],
);

export const pageLocales = pgTable(
  "page_locale",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    contentJson: jsonb("content_json")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: text("seo_description"),
    ...publicationColumns(),
  },
  (table) => [
    uniqueIndex("page_locale_page_locale_unique").on(
      table.pageId,
      table.locale,
    ),
    uniqueIndex("page_locale_locale_slug_unique").on(table.locale, table.slug),
  ],
);

export const contentRevisions = pgTable(
  "content_revision",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entityType: varchar("entity_type", { length: 80 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    locale: localeEnum("locale").notNull(),
    revisionNo: integer("revision_no").notNull(),
    snapshot: jsonb("snapshot")
      .$type<Record<string, unknown>>()
      .notNull(),
    createdBy: uuid("created_by").references(() => adminUsers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("content_revision_entity_locale_number_unique").on(
      table.entityType,
      table.entityId,
      table.locale,
      table.revisionNo,
    ),
    check("content_revision_number_positive", sql`${table.revisionNo} > 0`),
  ],
);

export const slugRedirects = pgTable(
  "slug_redirect",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    locale: localeEnum("locale").notNull(),
    entityType: varchar("entity_type", { length: 80 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    oldPath: varchar("old_path", { length: 512 }).notNull(),
    newPath: varchar("new_path", { length: 512 }).notNull(),
    httpStatus: integer("http_status").default(301).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("slug_redirect_old_path_unique").on(table.oldPath),
    index("slug_redirect_entity_idx").on(
      table.entityType,
      table.entityId,
      table.locale,
    ),
    check("slug_redirect_http_status_301", sql`${table.httpStatus} = 301`),
    check("slug_redirect_paths_differ", sql`${table.oldPath} <> ${table.newPath}`),
  ],
);

export const brands = pgTable(
  "brand",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    logoMediaId: uuid("logo_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    featured: boolean("featured").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    status: recordStatusEnum("status").default("active").notNull(),
  },
  (table) => [index("brand_sort_idx").on(table.sortOrder)],
);

export const brandLocales = pgTable(
  "brand_locale",
  {
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    shortDescription: text("short_description"),
    ...publicationColumns(),
  },
  (table) => [
    primaryKey({
      columns: [table.brandId, table.locale],
      name: "brand_locale_primary_key",
    }),
  ],
);

export const productGroups = pgTable(
  "product_group",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: varchar("key", { length: 120 }).notNull(),
    imageMediaId: uuid("image_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    sortOrder: integer("sort_order").default(0).notNull(),
    status: recordStatusEnum("status").default("active").notNull(),
  },
  (table) => [
    uniqueIndex("product_group_key_unique").on(table.key),
    index("product_group_sort_idx").on(table.sortOrder),
  ],
);

export const productGroupLocales = pgTable(
  "product_group_locale",
  {
    productGroupId: uuid("product_group_id")
      .notNull()
      .references(() => productGroups.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    shortDescription: text("short_description"),
    ...publicationColumns(),
  },
  (table) => [
    primaryKey({
      columns: [table.productGroupId, table.locale],
      name: "product_group_locale_primary_key",
    }),
    uniqueIndex("product_group_locale_slug_unique").on(
      table.locale,
      table.slug,
    ),
  ],
);

export const locations = pgTable(
  "location",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: varchar("key", { length: 120 }).notNull(),
    addressData: jsonb("address_data").$type<Record<string, unknown>>(),
    contactData: jsonb("contact_data").$type<Record<string, unknown>>(),
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),
    mediaId: uuid("media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    sortOrder: integer("sort_order").default(0).notNull(),
    status: recordStatusEnum("status").default("active").notNull(),
  },
  (table) => [
    uniqueIndex("location_key_unique").on(table.key),
    index("location_sort_idx").on(table.sortOrder),
  ],
);

export const locationLocales = pgTable(
  "location_locale",
  {
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    workingHoursText: text("working_hours_text"),
    ...publicationColumns(),
  },
  (table) => [
    primaryKey({
      columns: [table.locationId, table.locale],
      name: "location_locale_primary_key",
    }),
  ],
);

export const departments = pgTable(
  "department",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: varchar("key", { length: 120 }).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    status: recordStatusEnum("status").default("active").notNull(),
  },
  (table) => [
    uniqueIndex("department_key_unique").on(table.key),
    index("department_sort_idx").on(table.sortOrder),
  ],
);

export const departmentLocales = pgTable(
  "department_locale",
  {
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    ...publicationColumns(),
  },
  (table) => [
    primaryKey({
      columns: [table.departmentId, table.locale],
      name: "department_locale_primary_key",
    }),
  ],
);

export const jobPostings = pgTable(
  "job_posting",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    locationId: uuid("location_id").references(() => locations.id, {
      onDelete: "set null",
    }),
    status: recordStatusEnum("status").default("inactive").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    closingAt: timestamp("closing_at", { withTimezone: true }),
  },
  (table) => [
    index("job_posting_department_location_idx").on(
      table.departmentId,
      table.locationId,
    ),
  ],
);

export const jobPostingLocales = pgTable(
  "job_posting_locale",
  {
    jobPostingId: uuid("job_posting_id")
      .notNull()
      .references(() => jobPostings.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    summary: text("summary"),
    description: text("description").notNull(),
    ...publicationColumns(),
  },
  (table) => [
    primaryKey({
      columns: [table.jobPostingId, table.locale],
      name: "job_posting_locale_primary_key",
    }),
    uniqueIndex("job_posting_locale_slug_unique").on(
      table.locale,
      table.slug,
    ),
  ],
);

export const careerApplications = pgTable(
  "career_application",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobPostingId: uuid("job_posting_id").references(() => jobPostings.id, {
      onDelete: "set null",
    }),
    firstName: varchar("first_name", { length: 120 }).notNull(),
    lastName: varchar("last_name", { length: 120 }).notNull(),
    phoneNormalized: varchar("phone_normalized", { length: 32 }).notNull(),
    emailNormalized: varchar("email_normalized", { length: 320 }).notNull(),
    gender: varchar("gender", { length: 80 }),
    birthDate: date("birth_date"),
    maritalStatus: varchar("marital_status", { length: 80 }),
    militaryStatus: varchar("military_status", { length: 80 }),
    defermentDate: date("deferment_date"),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    knowsCompany: boolean("knows_company").notNull(),
    knowsCompanySource: text("knows_company_source"),
    expectedSalaryTry: numeric("expected_salary_try", {
      precision: 12,
      scale: 2,
    }).notNull(),
    availableFrom: date("available_from").notNull(),
    aboutText: text("about_text").notNull(),
    cvFileId: uuid("cv_file_id")
      .notNull()
      .references(() => media.id, { onDelete: "restrict" }),
    locale: localeEnum("locale").notNull(),
    privacyNoticeVersion: varchar("privacy_notice_version", {
      length: 120,
    }).notNull(),
    privacyNoticeShownAt: timestamp("privacy_notice_shown_at", {
      withTimezone: true,
    }).notNull(),
    privacyAcknowledgedAt: timestamp("privacy_acknowledged_at", {
      withTimezone: true,
    }),
    status: applicationStatusEnum("status").default("new").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    retentionDueAt: timestamp("retention_due_at", {
      withTimezone: true,
    }).notNull(),
  },
  (table) => [
    index("career_application_status_created_idx").on(
      table.status,
      table.createdAt,
    ),
    index("career_application_retention_idx").on(table.retentionDueAt),
    check(
      "career_application_company_source_consistent",
      sql`(${table.knowsCompany} AND ${table.knowsCompanySource} IS NOT NULL) OR (NOT ${table.knowsCompany} AND ${table.knowsCompanySource} IS NULL)`,
    ),
    check(
      "career_application_salary_nonnegative",
      sql`${table.expectedSalaryTry} >= 0`,
    ),
  ],
);

export const careerApplicationNotes = pgTable(
  "career_application_note",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => careerApplications.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdBy: uuid("created_by").references(() => adminUsers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("career_application_note_application_idx").on(table.applicationId)],
);

export const applicationStatusHistory = pgTable(
  "application_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => careerApplications.id, { onDelete: "cascade" }),
    fromStatus: applicationStatusEnum("from_status"),
    toStatus: applicationStatusEnum("to_status").notNull(),
    changedBy: uuid("changed_by").references(() => adminUsers.id, {
      onDelete: "set null",
    }),
    changedAt: timestamp("changed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("application_status_history_application_idx").on(
      table.applicationId,
      table.changedAt,
    ),
  ],
);

export const contactSubmissions = pgTable(
  "contact_submission",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 240 }).notNull(),
    company: varchar("company", { length: 255 }),
    emailNormalized: varchar("email_normalized", { length: 320 }).notNull(),
    phoneNormalized: varchar("phone_normalized", { length: 32 }),
    subject: varchar("subject", { length: 255 }).notNull(),
    message: text("message").notNull(),
    locale: localeEnum("locale").notNull(),
    privacyNoticeVersion: varchar("privacy_notice_version", {
      length: 120,
    }).notNull(),
    privacyNoticeShownAt: timestamp("privacy_notice_shown_at", {
      withTimezone: true,
    }).notNull(),
    privacyAcknowledgedAt: timestamp("privacy_acknowledged_at", {
      withTimezone: true,
    }),
    status: contactStatusEnum("status").default("new").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    retentionDueAt: timestamp("retention_due_at", {
      withTimezone: true,
    }).notNull(),
  },
  (table) => [
    index("contact_submission_status_created_idx").on(
      table.status,
      table.createdAt,
    ),
    index("contact_submission_retention_idx").on(table.retentionDueAt),
  ],
);

export const siteSettings = pgTable("site_setting", {
  key: siteSettingKeyEnum("key").primaryKey(),
  typedValue: jsonb("typed_value").$type<unknown>().notNull(),
  updatedBy: uuid("updated_by").references(() => adminUsers.id, {
    onDelete: "set null",
  }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const auditEvents = pgTable(
  "audit_event",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => adminUsers.id, {
      onDelete: "set null",
    }),
    eventType: varchar("event_type", { length: 160 }).notNull(),
    resourceType: varchar("resource_type", { length: 120 }).notNull(),
    resourceId: uuid("resource_id"),
    metadataRedacted: jsonb("metadata_redacted")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_event_resource_idx").on(
      table.resourceType,
      table.resourceId,
      table.createdAt,
    ),
    index("audit_event_actor_idx").on(table.actorUserId, table.createdAt),
  ],
);

export type NewCareerApplication = typeof careerApplications.$inferInsert;
export type CareerApplication = typeof careerApplications.$inferSelect;
export type NewContactSubmission = typeof contactSubmissions.$inferInsert;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
