import { and, asc, desc, eq, sql } from "drizzle-orm";

import {
  parsePublicPageContent,
  publicPageRouteKeys,
  type PublicPageDocument,
  type PublicPageRouteKey,
} from "@/content/public-pages";
import type { DatabaseClient } from "@/db/client";
import {
  contentRevisions,
  contentDrafts,
  pageLocales,
  pages,
  slugRedirects,
} from "@/db/schema";
import { isLocale, type Locale } from "@/i18n/config";
import { routeDefinitions } from "@/i18n/routes";
import { appendAuditEvent } from "@/security/audit";
import {
  InvalidSecurityInputError,
  ResourceNotFoundError,
} from "@/security/errors";
import {
  assertAuthorized,
  type AdminPrincipal,
} from "@/security/rbac/authorization";
import type { PermissionKey } from "@/security/rbac/catalog";

const legalRoutes = new Set<PublicPageRouteKey>([
  "privacy",
  "cookies",
  "data-protection",
]);
const careerRoutes = new Set<PublicPageRouteKey>(["careers", "career-apply"]);

export type PagePublicationAction =
  | "publish"
  | "schedule"
  | "archive"
  | "schedule-archive";

export type PageDraftInput = {
  routeKey: PublicPageRouteKey;
  locale: Locale;
  title: string;
  content: Record<string, unknown>;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogMediaId?: string | null;
  allowIndexing?: boolean;
};

type PageSnapshot = {
  slug: string;
  title: string;
  contentJson: Record<string, unknown>;
  seoTitle: string | null;
  seoDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogMediaId: string | null;
  allowIndexing: boolean;
  publishStatus: "draft" | "published" | "archived";
  publishedAt: string | null;
  scheduledPublishAt: string | null;
  scheduledArchiveAt: string | null;
};

function permissionFor(
  routeKey: PublicPageRouteKey,
  operation: "view" | "edit" | "preview" | "publish" | "schedule" | "archive" | "rollback",
): PermissionKey {
  if (legalRoutes.has(routeKey)) {
    if (operation === "edit") return "LegalPages:edit";
    if (operation === "rollback") return "LegalPages:edit";
    if (operation === "publish" || operation === "schedule" || operation === "archive") {
      return "LegalPages:publish";
    }
    return "LegalPages:view";
  }
  if (careerRoutes.has(routeKey)) {
    if (operation === "edit") return "CareerContent:edit";
    if (operation === "rollback") return "CareerContent:edit";
    if (operation === "publish" || operation === "schedule" || operation === "archive") {
      return "CareerContent:publish";
    }
    return "CareerContent:view";
  }
  const suffix = operation === "view" ? "view" : operation;
  return `Pages:${suffix}` as PermissionKey;
}

function assertPagePermission(
  principal: AdminPrincipal | null,
  routeKey: PublicPageRouteKey,
  operation: Parameters<typeof permissionFor>[1],
): asserts principal is AdminPrincipal {
  assertAuthorized(principal, {
    permission: permissionFor(routeKey, operation),
    environment: process.env.APP_ENV,
  });
}

function normalizedText(value: string | null | undefined, max: number) {
  if (value == null) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > max) throw new InvalidSecurityInputError("content_text_too_long");
  return normalized;
}

function validateUuid(value: string | null | undefined) {
  if (!value) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new InvalidSecurityInputError("content_media_id_invalid");
  }
  return value;
}

export function validatePageDraftInput(input: PageDraftInput): PageDraftInput & {
  title: string;
  content: Record<string, unknown>;
} {
  if (!publicPageRouteKeys.includes(input.routeKey) || !isLocale(input.locale)) {
    throw new InvalidSecurityInputError("content_route_or_locale_invalid");
  }
  const title = normalizedText(input.title, 255);
  if (!title) throw new InvalidSecurityInputError("content_title_required");
  const serialized = JSON.stringify(input.content);
  if (serialized.length > 120_000) {
    throw new InvalidSecurityInputError("content_payload_too_large");
  }
  const parsed = parsePublicPageContent(input.content, title);
  if (!input.content.hero || parsed.hero.heading === title && !(input.content.hero as Record<string, unknown>).heading) {
    throw new InvalidSecurityInputError("content_hero_heading_required");
  }
  const rawApproval = input.content.approval;
  const approval = rawApproval && typeof rawApproval === "object" && !Array.isArray(rawApproval)
    ? rawApproval as Record<string, unknown>
    : undefined;
  const normalizedContent: Record<string, unknown> = parsed as unknown as Record<string, unknown>;
  if (legalRoutes.has(input.routeKey) && approval?.status === "approved" && typeof approval.reference === "string") {
    normalizedContent.approval = { status: "approved", reference: approval.reference.trim().slice(0, 160) };
  }
  return {
    ...input,
    title,
    content: normalizedContent,
    seoTitle: normalizedText(input.seoTitle, 255),
    seoDescription: normalizedText(input.seoDescription, 2_000),
    ogTitle: normalizedText(input.ogTitle, 255),
    ogDescription: normalizedText(input.ogDescription, 2_000),
    ogMediaId: validateUuid(input.ogMediaId),
    allowIndexing: input.allowIndexing !== false,
  };
}

function snapshotFromRow(row: {
  slug: string;
  title: string;
  contentJson: Record<string, unknown>;
  seoTitle: string | null;
  seoDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogMediaId: string | null;
  allowIndexing: boolean;
  publishStatus: "draft" | "published" | "archived";
  publishedAt: Date | null;
  scheduledPublishAt: Date | null;
  scheduledArchiveAt: Date | null;
}): PageSnapshot {
  return {
    ...row,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    scheduledPublishAt: row.scheduledPublishAt?.toISOString() ?? null,
    scheduledArchiveAt: row.scheduledArchiveAt?.toISOString() ?? null,
  };
}

async function appendPageRevision(
  db: Parameters<Parameters<DatabaseClient["transaction"]>[0]>[0],
  pageId: string,
  locale: Locale,
  snapshot: PageSnapshot,
  actorUserId: string,
) {
  const [latest] = await db
    .select({ revisionNo: sql<number>`coalesce(max(${contentRevisions.revisionNo}), 0)` })
    .from(contentRevisions)
    .where(
      and(
        eq(contentRevisions.entityType, "page"),
        eq(contentRevisions.entityId, pageId),
        eq(contentRevisions.locale, locale),
      ),
    );
  const revisionNo = Number(latest?.revisionNo ?? 0) + 1;
  await db.insert(contentRevisions).values({
    entityType: "page",
    entityId: pageId,
    locale,
    revisionNo,
    snapshot,
    createdBy: actorUserId,
  });
  return revisionNo;
}

export async function savePageDraft(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  rawInput: PageDraftInput,
) {
  const input = validatePageDraftInput(rawInput);
  assertPagePermission(principal, input.routeKey, "edit");

  const [current] = await db
    .select({
      pageId: pages.id,
      seoTitle: pageLocales.seoTitle,
      seoDescription: pageLocales.seoDescription,
      ogTitle: pageLocales.ogTitle,
      ogDescription: pageLocales.ogDescription,
      ogMediaId: pageLocales.ogMediaId,
      allowIndexing: pageLocales.allowIndexing,
    })
    .from(pages)
    .leftJoin(
      pageLocales,
      and(eq(pageLocales.pageId, pages.id), eq(pageLocales.locale, input.locale)),
    )
    .where(eq(pages.routeKey, input.routeKey))
    .limit(1);

  const [existingDraft] = current ? await db.select({ snapshot: contentDrafts.snapshot }).from(contentDrafts)
    .where(and(eq(contentDrafts.entityType, "page"), eq(contentDrafts.entityId, current.pageId), eq(contentDrafts.locale, input.locale))).limit(1) : [];
  const comparison = existingDraft ? parseRevisionSnapshot(existingDraft.snapshot) : current;
  const seoChanged = (comparison &&
    (comparison.seoTitle !== input.seoTitle ||
      comparison.seoDescription !== input.seoDescription ||
      comparison.ogTitle !== input.ogTitle ||
      comparison.ogDescription !== input.ogDescription ||
      comparison.ogMediaId !== input.ogMediaId ||
      comparison.allowIndexing !== input.allowIndexing)) ||
    (!current && Boolean(input.seoTitle || input.seoDescription || input.ogTitle || input.ogDescription || input.ogMediaId || input.allowIndexing === false));
  if (seoChanged) {
    assertAuthorized(principal, {
      permission: "SEO:edit",
      environment: process.env.APP_ENV,
    });
  }

  const now = new Date();
  return db.transaction(async (transaction) => {
    const [page] = await transaction
      .insert(pages)
      .values({ routeKey: input.routeKey, templateKey: input.routeKey, updatedAt: now })
      .onConflictDoUpdate({
        target: pages.routeKey,
        set: { updatedAt: now },
      })
      .returning({ id: pages.id });
    if (!page) throw new ResourceNotFoundError();

    const slug = routeDefinitions[input.routeKey][input.locale];
    const [existingLocale] = await transaction.select().from(pageLocales)
      .where(and(eq(pageLocales.pageId, page.id), eq(pageLocales.locale, input.locale))).limit(1);
    if (!existingLocale) {
      await transaction.insert(pageLocales).values({
        pageId: page.id,
        locale: input.locale,
        slug,
        title: input.title,
        contentJson: input.content,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        ogTitle: input.ogTitle,
        ogDescription: input.ogDescription,
        ogMediaId: input.ogMediaId,
        allowIndexing: input.allowIndexing,
        publishStatus: "draft",
        publishedAt: null,
        scheduledPublishAt: null,
        scheduledArchiveAt: null,
      });
    }
    const draftSnapshot: PageSnapshot = {
      slug,
      title: input.title,
      contentJson: input.content,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      ogTitle: input.ogTitle ?? null,
      ogDescription: input.ogDescription ?? null,
      ogMediaId: input.ogMediaId ?? null,
      allowIndexing: input.allowIndexing !== false,
      publishStatus: "draft",
      publishedAt: null,
      scheduledPublishAt: null,
      scheduledArchiveAt: null,
    };
    await transaction.insert(contentDrafts).values({
      entityType: "page",
      entityId: page.id,
      locale: input.locale,
      snapshot: draftSnapshot,
      updatedBy: principal.userId,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: [contentDrafts.entityType, contentDrafts.entityId, contentDrafts.locale],
      set: { snapshot: draftSnapshot, updatedBy: principal.userId, updatedAt: now },
    });
    const revisionNo = await appendPageRevision(
      transaction,
      page.id,
      input.locale,
      draftSnapshot,
      principal.userId,
    );
    await appendAuditEvent(transaction, {
      actorUserId: principal.userId,
      eventType: "content.page_draft_saved",
      resourceType: "page",
      resourceId: page.id,
      metadata: { routeKey: input.routeKey, locale: input.locale, revisionNo },
    });
    return { pageId: page.id, locale: input.locale, revisionNo };
  });
}

function legalContentHasApprovalReference(content: Record<string, unknown>) {
  const approval = content.approval;
  if (!approval || typeof approval !== "object" || Array.isArray(approval)) return false;
  const record = approval as Record<string, unknown>;
  return record.status === "approved" &&
    typeof record.reference === "string" &&
    record.reference.trim().length >= 3 &&
    record.reference.trim().length <= 160;
}

export async function transitionPagePublication(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  input: {
    routeKey: PublicPageRouteKey;
    locale: Locale;
    action: PagePublicationAction;
    scheduledAt?: Date;
  },
) {
  if (!publicPageRouteKeys.includes(input.routeKey) || !isLocale(input.locale)) {
    throw new InvalidSecurityInputError("content_route_or_locale_invalid");
  }
  const operation = input.action === "schedule-archive" ? "schedule" : input.action;
  assertPagePermission(principal, input.routeKey, operation);
  const [current] = await db
    .select({ pageId: pages.id, localeRow: pageLocales })
    .from(pages)
    .innerJoin(
      pageLocales,
      and(eq(pageLocales.pageId, pages.id), eq(pageLocales.locale, input.locale)),
    )
    .where(eq(pages.routeKey, input.routeKey))
    .limit(1);
  if (!current) throw new ResourceNotFoundError();
  const [draft] = await db.select({ snapshot: contentDrafts.snapshot }).from(contentDrafts)
    .where(and(eq(contentDrafts.entityType, "page"), eq(contentDrafts.entityId, current.pageId), eq(contentDrafts.locale, input.locale)))
    .limit(1);
  const draftSnapshot = draft ? parseRevisionSnapshot(draft.snapshot) : undefined;
  if (
    legalRoutes.has(input.routeKey) &&
    (input.action === "publish" || input.action === "schedule") &&
    !legalContentHasApprovalReference(draftSnapshot?.contentJson ?? current.localeRow.contentJson)
  ) {
    throw new InvalidSecurityInputError("legal_approval_reference_required");
  }
  const now = new Date();
  const scheduledAt = input.scheduledAt;
  if ((input.action === "schedule" || input.action === "schedule-archive") &&
      (!scheduledAt || scheduledAt.getTime() <= now.getTime())) {
    throw new InvalidSecurityInputError("content_schedule_must_be_future");
  }
  const publishContent = draftSnapshot ? {
    slug: routeDefinitions[input.routeKey][input.locale],
    title: draftSnapshot.title,
    contentJson: draftSnapshot.contentJson,
    seoTitle: draftSnapshot.seoTitle,
    seoDescription: draftSnapshot.seoDescription,
    ogTitle: draftSnapshot.ogTitle,
    ogDescription: draftSnapshot.ogDescription,
    ogMediaId: draftSnapshot.ogMediaId,
    allowIndexing: draftSnapshot.allowIndexing,
  } : {};
  const update = input.action === "publish"
    ? { ...publishContent, publishStatus: "published" as const, publishedAt: now, scheduledPublishAt: null }
    : input.action === "archive"
      ? { publishStatus: "archived" as const, scheduledArchiveAt: null }
      : input.action === "schedule"
        ? { scheduledPublishAt: scheduledAt! }
        : { scheduledArchiveAt: scheduledAt! };
  return db.transaction(async (transaction) => {
    const [saved] = await transaction
      .update(pageLocales)
      .set(update)
      .where(eq(pageLocales.id, current.localeRow.id))
      .returning();
    if (!saved) throw new ResourceNotFoundError();
    if (input.action === "publish") {
      await transaction.delete(contentDrafts).where(and(
        eq(contentDrafts.entityType, "page"),
        eq(contentDrafts.entityId, current.pageId),
        eq(contentDrafts.locale, input.locale),
      ));
    }
    const revisionNo = await appendPageRevision(
      transaction,
      current.pageId,
      input.locale,
      snapshotFromRow(saved),
      principal.userId,
    );
    await appendAuditEvent(transaction, {
      actorUserId: principal.userId,
      eventType: `content.page_${input.action.replace("-", "_")}`,
      resourceType: "page",
      resourceId: current.pageId,
      metadata: {
        routeKey: input.routeKey,
        locale: input.locale,
        revisionNo,
        scheduledAt: scheduledAt?.toISOString(),
      },
    });
    return { pageId: current.pageId, locale: input.locale, revisionNo };
  });
}

function parseRevisionSnapshot(value: Record<string, unknown>): PageSnapshot {
  const requiredStrings = ["slug", "title", "publishStatus"] as const;
  if (requiredStrings.some((key) => typeof value[key] !== "string") ||
      !value.contentJson || typeof value.contentJson !== "object" || Array.isArray(value.contentJson)) {
    throw new InvalidSecurityInputError("revision_snapshot_invalid");
  }
  return value as unknown as PageSnapshot;
}

export async function rollbackPageRevision(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  input: { routeKey: PublicPageRouteKey; locale: Locale; revisionNo: number },
) {
  assertPagePermission(principal, input.routeKey, "rollback");
  const [page] = await db.select({ id: pages.id }).from(pages)
    .where(eq(pages.routeKey, input.routeKey)).limit(1);
  if (!page) throw new ResourceNotFoundError();
  const [revision] = await db.select({ snapshot: contentRevisions.snapshot })
    .from(contentRevisions)
    .where(and(
      eq(contentRevisions.entityType, "page"),
      eq(contentRevisions.entityId, page.id),
      eq(contentRevisions.locale, input.locale),
      eq(contentRevisions.revisionNo, input.revisionNo),
    )).limit(1);
  if (!revision) throw new ResourceNotFoundError();
  const snapshot = parseRevisionSnapshot(revision.snapshot);
  const parsedContent = parsePublicPageContent(snapshot.contentJson, snapshot.title);
  return db.transaction(async (transaction) => {
    const restored: PageSnapshot = {
      slug: routeDefinitions[input.routeKey][input.locale],
      title: snapshot.title,
      contentJson: parsedContent as unknown as Record<string, unknown>,
      seoTitle: snapshot.seoTitle,
      seoDescription: snapshot.seoDescription,
      ogTitle: snapshot.ogTitle,
      ogDescription: snapshot.ogDescription,
      ogMediaId: snapshot.ogMediaId,
      allowIndexing: snapshot.allowIndexing,
      publishStatus: "draft",
      publishedAt: null,
      scheduledPublishAt: null,
      scheduledArchiveAt: null,
    };
    await transaction.insert(contentDrafts).values({
      entityType: "page", entityId: page.id, locale: input.locale,
      snapshot: restored, updatedBy: principal.userId, updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: [contentDrafts.entityType, contentDrafts.entityId, contentDrafts.locale],
      set: { snapshot: restored, updatedBy: principal.userId, updatedAt: new Date() },
    });
    const newRevisionNo = await appendPageRevision(
      transaction,
      page.id,
      input.locale,
      restored,
      principal.userId,
    );
    await appendAuditEvent(transaction, {
      actorUserId: principal.userId,
      eventType: "content.page_revision_rolled_back",
      resourceType: "page",
      resourceId: page.id,
      metadata: { routeKey: input.routeKey, locale: input.locale, fromRevisionNo: input.revisionNo, newRevisionNo },
    });
    return { pageId: page.id, locale: input.locale, revisionNo: newRevisionNo };
  });
}

export async function listPageWorkspace(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
) {
  assertAuthorized(principal, { permission: "Pages:view", environment: process.env.APP_ENV });
  return db.select({
    pageId: pages.id,
    routeKey: pages.routeKey,
    locale: pageLocales.locale,
    title: pageLocales.title,
    slug: pageLocales.slug,
    publishStatus: pageLocales.publishStatus,
    publishedAt: pageLocales.publishedAt,
    scheduledPublishAt: pageLocales.scheduledPublishAt,
    scheduledArchiveAt: pageLocales.scheduledArchiveAt,
  }).from(pages).leftJoin(pageLocales, eq(pageLocales.pageId, pages.id))
    .orderBy(asc(pages.routeKey), asc(pageLocales.locale));
}

export async function listPageRevisions(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  routeKey: PublicPageRouteKey,
  locale: Locale,
) {
  assertPagePermission(principal, routeKey, "view");
  const [page] = await db.select({ id: pages.id }).from(pages).where(eq(pages.routeKey, routeKey)).limit(1);
  if (!page) return [];
  return db.select({
    revisionNo: contentRevisions.revisionNo,
    createdAt: contentRevisions.createdAt,
    createdBy: contentRevisions.createdBy,
  }).from(contentRevisions).where(and(
    eq(contentRevisions.entityType, "page"),
    eq(contentRevisions.entityId, page.id),
    eq(contentRevisions.locale, locale),
  )).orderBy(desc(contentRevisions.revisionNo));
}

export async function getPageEditorState(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  routeKey: PublicPageRouteKey,
  locale: Locale,
) {
  assertPagePermission(principal, routeKey, "view");
  const [row] = await db.select({
    pageId: pages.id,
    title: pageLocales.title,
    slug: pageLocales.slug,
    content: pageLocales.contentJson,
    seoTitle: pageLocales.seoTitle,
    seoDescription: pageLocales.seoDescription,
    ogTitle: pageLocales.ogTitle,
    ogDescription: pageLocales.ogDescription,
    ogMediaId: pageLocales.ogMediaId,
    allowIndexing: pageLocales.allowIndexing,
    publishStatus: pageLocales.publishStatus,
    publishedAt: pageLocales.publishedAt,
    scheduledPublishAt: pageLocales.scheduledPublishAt,
    scheduledArchiveAt: pageLocales.scheduledArchiveAt,
  }).from(pages).innerJoin(pageLocales, and(eq(pageLocales.pageId, pages.id), eq(pageLocales.locale, locale)))
    .where(eq(pages.routeKey, routeKey)).limit(1);
  if (!row) return undefined;
  const [draft] = await db.select({ snapshot: contentDrafts.snapshot }).from(contentDrafts)
    .where(and(eq(contentDrafts.entityType, "page"), eq(contentDrafts.entityId, row.pageId), eq(contentDrafts.locale, locale)))
    .limit(1);
  if (!draft) return { ...row, hasDraft: false };
  const snapshot = parseRevisionSnapshot(draft.snapshot);
  return {
    ...row,
    title: snapshot.title,
    slug: snapshot.slug,
    content: snapshot.contentJson,
    seoTitle: snapshot.seoTitle,
    seoDescription: snapshot.seoDescription,
    ogTitle: snapshot.ogTitle,
    ogDescription: snapshot.ogDescription,
    ogMediaId: snapshot.ogMediaId,
    allowIndexing: snapshot.allowIndexing,
    hasDraft: true,
  };
}

export async function loadPagePreview(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  routeKey: PublicPageRouteKey,
  locale: Locale,
): Promise<PublicPageDocument> {
  assertPagePermission(principal, routeKey, "preview");
  const rows = await db.select({
    pageId: pages.id,
    locale: pageLocales.locale,
    slug: pageLocales.slug,
    title: pageLocales.title,
    contentJson: pageLocales.contentJson,
    seoTitle: pageLocales.seoTitle,
    seoDescription: pageLocales.seoDescription,
    ogTitle: pageLocales.ogTitle,
    ogDescription: pageLocales.ogDescription,
    ogMediaId: pageLocales.ogMediaId,
    allowIndexing: pageLocales.allowIndexing,
  }).from(pages).innerJoin(pageLocales, eq(pageLocales.pageId, pages.id))
    .where(eq(pages.routeKey, routeKey));
  const selected = rows.find((row) => row.locale === locale);
  if (!selected) throw new ResourceNotFoundError();
  const [draft] = await db.select({ snapshot: contentDrafts.snapshot }).from(contentDrafts)
    .where(and(eq(contentDrafts.entityType, "page"), eq(contentDrafts.entityId, selected.pageId), eq(contentDrafts.locale, locale)))
    .limit(1);
  const snapshot = draft ? parseRevisionSnapshot(draft.snapshot) : undefined;
  return {
    routeKey,
    locale,
    slug: snapshot?.slug ?? selected.slug,
    title: snapshot?.title ?? selected.title,
    seoTitle: snapshot?.seoTitle ?? selected.seoTitle ?? undefined,
    seoDescription: snapshot?.seoDescription ?? selected.seoDescription ?? undefined,
    ogTitle: snapshot?.ogTitle ?? selected.ogTitle ?? undefined,
    ogDescription: snapshot?.ogDescription ?? selected.ogDescription ?? undefined,
    ogMediaId: snapshot?.ogMediaId ?? selected.ogMediaId ?? undefined,
    allowIndexing: snapshot?.allowIndexing ?? selected.allowIndexing,
    content: parsePublicPageContent(snapshot?.contentJson ?? selected.contentJson, snapshot?.title ?? selected.title),
    source: "cms",
    availableLocales: rows.map((row) => row.locale),
  };
}

export function validateSlugRedirect(input: {
  locale: Locale;
  oldPath: string;
  newPath: string;
}) {
  const prefix = `/${input.locale}/`;
  const normalize = (value: string) => value.trim().replace(/\/{2,}/g, "/").replace(/\/$/, "");
  const oldPath = normalize(input.oldPath);
  const newPath = normalize(input.newPath);
  if (!oldPath.startsWith(prefix) || !newPath.startsWith(prefix) || oldPath === newPath ||
      oldPath.includes("?") || oldPath.includes("#") || newPath.includes("?") || newPath.includes("#")) {
    throw new InvalidSecurityInputError("slug_redirect_invalid");
  }
  return { oldPath, newPath };
}

export async function createSlugRedirect(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  input: { locale: Locale; entityType: string; entityId: string; oldPath: string; newPath: string },
) {
  assertAuthorized(principal, { permission: "Pages:edit", environment: process.env.APP_ENV });
  const paths = validateSlugRedirect(input);
  const reverse = await db.select({ id: slugRedirects.id }).from(slugRedirects)
    .where(and(eq(slugRedirects.oldPath, paths.newPath), eq(slugRedirects.newPath, paths.oldPath)))
    .limit(1);
  if (reverse.length) throw new InvalidSecurityInputError("slug_redirect_loop");
  const [created] = await db.insert(slugRedirects).values({
    locale: input.locale,
    entityType: input.entityType.slice(0, 80),
    entityId: input.entityId,
    oldPath: paths.oldPath,
    newPath: paths.newPath,
  }).returning();
  await appendAuditEvent(db, {
    actorUserId: principal.userId,
    eventType: "content.slug_redirect_created",
    resourceType: "slug_redirect",
    resourceId: created?.id,
    metadata: { locale: input.locale, oldPath: paths.oldPath, newPath: paths.newPath },
  });
  return created;
}

export async function resolveActiveSlugRedirect(db: DatabaseClient, path: string) {
  const [redirect] = await db.select({ newPath: slugRedirects.newPath, status: slugRedirects.httpStatus })
    .from(slugRedirects)
    .where(and(eq(slugRedirects.oldPath, path), sql`${slugRedirects.disabledAt} is null`))
    .limit(1);
  return redirect;
}
