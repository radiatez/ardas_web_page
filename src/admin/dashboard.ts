import { and, eq, isNull, sql } from "drizzle-orm";

import type { DatabaseClient } from "@/db/client";
import {
  contactSubmissions,
  contentRevisions,
  pageLocales,
  pages,
  siteSettings,
} from "@/db/schema";
import { assertAuthorized, type AdminPrincipal } from "@/security/rbac/authorization";
import type { PermissionKey } from "@/security/rbac/catalog";

function hasPermission(principal: AdminPrincipal, permission: PermissionKey) {
  return Boolean(principal.permissions[permission]?.length);
}

export type AdminDashboard = {
  content?: {
    drafts: number;
    missingTranslations: number;
    recentRevisions: number;
  };
  contact?: { newMessages: number };
  providers?: {
    database: boolean;
    auth0: boolean;
    publicStorage: boolean;
    email: boolean;
    monitoring: boolean;
  };
};

export async function loadAdminDashboard(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
): Promise<AdminDashboard> {
  assertAuthorized(principal, { permission: "Dashboard:view", environment: process.env.APP_ENV });
  const result: AdminDashboard = {};

  if (hasPermission(principal, "Pages:view")) {
    const [draftRow, missingRow, revisionRow] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(pageLocales)
        .where(eq(pageLocales.publishStatus, "draft")),
      db.select({ count: sql<number>`count(*)::int` }).from(pages)
        .leftJoin(pageLocales, eq(pageLocales.pageId, pages.id))
        .groupBy(pages.id)
        .having(sql`count(${pageLocales.locale}) < 2`),
      db.select({ count: sql<number>`count(*)::int` }).from(contentRevisions)
        .where(sql`${contentRevisions.createdAt} >= now() - interval '7 days'`),
    ]);
    result.content = {
      drafts: Number(draftRow[0]?.count ?? 0),
      missingTranslations: missingRow.length,
      recentRevisions: Number(revisionRow[0]?.count ?? 0),
    };
  }

  if (hasPermission(principal, "Contact:view")) {
    const [row] = await db.select({ count: sql<number>`count(*)::int` })
      .from(contactSubmissions)
      .where(and(eq(contactSubmissions.status, "new"), isNull(contactSubmissions.anonymizedAt)));
    result.contact = { newMessages: Number(row?.count ?? 0) };
  }

  if (hasPermission(principal, "SiteSettings:view")) {
    const configuredSettings = await db.select({ key: siteSettings.key }).from(siteSettings);
    const keys = new Set(configuredSettings.map((setting) => setting.key));
    result.providers = {
      database: Boolean(process.env.DATABASE_URL),
      auth0: Boolean(process.env.AUTH0_DOMAIN && process.env.AUTH0_CLIENT_ID),
      publicStorage: Boolean(process.env.S3_PUBLIC_BUCKET && process.env.PUBLIC_MEDIA_BASE_URL),
      email: Boolean(process.env.CONTACT_NOTIFICATION_RECIPIENT || keys.has("contact_notification_recipient")),
      monitoring: Boolean(process.env.SENTRY_DSN),
    };
  }
  return result;
}
