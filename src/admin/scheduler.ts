import { and, eq, lte, ne, sql } from "drizzle-orm";

import { isLegalPageRouteKey, legalContentCanPublish } from "@/content/legal-content";
import type { DatabaseClient } from "@/db/client";
import {
  auditEvents,
  brandLocales,
  contentDrafts,
  contentRevisions,
  departmentLocales,
  jobPostingLocales,
  locationLocales,
  mediaLocales,
  pageLocales,
  pages,
  productGroupLocales,
} from "@/db/schema";
import { securityLogger } from "@/security/logging";

type TransitionCount = { published: number; archived: number };
export type ScheduledContentResult = {
  pages: TransitionCount;
  brands: TransitionCount;
  productGroups: TransitionCount;
  locations: TransitionCount;
  departments: TransitionCount;
  media: TransitionCount;
  jobPostings: TransitionCount;
};

export async function runScheduledContentTransitions(
  db: DatabaseClient,
  options: { now?: Date } = {},
): Promise<ScheduledContentResult> {
  const now = options.now ?? new Date();
  return db.transaction(async (transaction) => {
    await transaction.execute(sql`select pg_advisory_xact_lock(64006)`);

    async function auditRows(
      entityType: string,
      action: "published" | "archived",
      rows: readonly { entityId: string; locale: string }[],
    ) {
      if (!rows.length) return;
      await transaction.insert(auditEvents).values(rows.map((row) => ({
        eventType: `content.scheduled_${action}`,
        resourceType: entityType,
        resourceId: row.entityId,
        metadataRedacted: { locale: row.locale, source: "scheduled_worker" },
      })));
    }

    async function finish(
      entityType: string,
      published: readonly { entityId: string; locale: string }[],
      archived: readonly { entityId: string; locale: string }[],
    ): Promise<TransitionCount> {
      await auditRows(entityType, "published", published);
      await auditRows(entityType, "archived", archived);
      return { published: published.length, archived: archived.length };
    }

    const pageDue = await transaction.select({ id: pageLocales.id, entityId: pageLocales.pageId,
      locale: pageLocales.locale, routeKey: pages.routeKey, currentContent: pageLocales.contentJson })
      .from(pageLocales).innerJoin(pages, eq(pages.id, pageLocales.pageId))
      .where(lte(pageLocales.scheduledPublishAt, now));
    const pagePublished: { entityId: string; locale: "tr" | "en" }[] = [];
    for (const due of pageDue) {
      const [draft] = await transaction.select({ snapshot: contentDrafts.snapshot, updatedBy: contentDrafts.updatedBy })
        .from(contentDrafts).where(and(eq(contentDrafts.entityType, "page"), eq(contentDrafts.entityId, due.entityId), eq(contentDrafts.locale, due.locale))).limit(1);
      const snapshot = draft?.snapshot;
      const contentJson = snapshot?.contentJson;
      const validSnapshot = snapshot && typeof snapshot.title === "string" && contentJson && typeof contentJson === "object" && !Array.isArray(contentJson);
      const publishableContent = validSnapshot
        ? contentJson as Record<string, unknown>
        : due.currentContent;
      if (
        isLegalPageRouteKey(due.routeKey) &&
        !legalContentCanPublish(publishableContent)
      ) {
        securityLogger.error("content.legal_schedule_blocked", {
          resourceId: due.entityId,
          routeKey: due.routeKey,
          locale: due.locale,
          errorCode: "LEGAL_METADATA_INVALID",
        });
        continue;
      }
      const [saved] = await transaction.update(pageLocales).set({
        ...(validSnapshot ? {
          title: snapshot.title as string,
          contentJson: contentJson as Record<string, unknown>,
          seoTitle: typeof snapshot.seoTitle === "string" ? snapshot.seoTitle : null,
          seoDescription: typeof snapshot.seoDescription === "string" ? snapshot.seoDescription : null,
          ogTitle: typeof snapshot.ogTitle === "string" ? snapshot.ogTitle : null,
          ogDescription: typeof snapshot.ogDescription === "string" ? snapshot.ogDescription : null,
          ogMediaId: typeof snapshot.ogMediaId === "string" ? snapshot.ogMediaId : null,
          allowIndexing: snapshot.allowIndexing !== false,
        } : {}),
        publishStatus: "published", publishedAt: now, scheduledPublishAt: null,
      }).where(eq(pageLocales.id, due.id)).returning();
      if (!saved) continue;
      if (draft) {
        await transaction.delete(contentDrafts).where(and(eq(contentDrafts.entityType, "page"),
          eq(contentDrafts.entityId, due.entityId), eq(contentDrafts.locale, due.locale)));
      }
      const [latest] = await transaction.select({ revisionNo: sql<number>`coalesce(max(${contentRevisions.revisionNo}), 0)` })
        .from(contentRevisions).where(and(eq(contentRevisions.entityType, "page"), eq(contentRevisions.entityId, due.entityId), eq(contentRevisions.locale, due.locale)));
      await transaction.insert(contentRevisions).values({ entityType: "page", entityId: due.entityId,
        locale: due.locale, revisionNo: Number(latest?.revisionNo ?? 0) + 1, createdBy: draft?.updatedBy,
        snapshot: { ...saved, publishedAt: saved.publishedAt?.toISOString() ?? null,
          scheduledPublishAt: null, scheduledArchiveAt: saved.scheduledArchiveAt?.toISOString() ?? null } });
      pagePublished.push({ entityId: due.entityId, locale: due.locale });
    }
    const pageArchived = await transaction.update(pageLocales).set({ publishStatus: "archived", scheduledArchiveAt: null })
      .where(and(ne(pageLocales.publishStatus, "archived"), lte(pageLocales.scheduledArchiveAt, now)))
      .returning({ entityId: pageLocales.pageId, locale: pageLocales.locale });
    const pagesResult = await finish("page", pagePublished, pageArchived);

    const brandPublished = await transaction.update(brandLocales).set({ publishStatus: "published", publishedAt: now, scheduledPublishAt: null })
      .where(and(eq(brandLocales.publishStatus, "draft"), lte(brandLocales.scheduledPublishAt, now)))
      .returning({ entityId: brandLocales.brandId, locale: brandLocales.locale });
    const brandArchived = await transaction.update(brandLocales).set({ publishStatus: "archived", scheduledArchiveAt: null })
      .where(and(ne(brandLocales.publishStatus, "archived"), lte(brandLocales.scheduledArchiveAt, now)))
      .returning({ entityId: brandLocales.brandId, locale: brandLocales.locale });
    const brandsResult = await finish("brand", brandPublished, brandArchived);

    const groupPublished = await transaction.update(productGroupLocales).set({ publishStatus: "published", publishedAt: now, scheduledPublishAt: null })
      .where(and(eq(productGroupLocales.publishStatus, "draft"), lte(productGroupLocales.scheduledPublishAt, now)))
      .returning({ entityId: productGroupLocales.productGroupId, locale: productGroupLocales.locale });
    const groupArchived = await transaction.update(productGroupLocales).set({ publishStatus: "archived", scheduledArchiveAt: null })
      .where(and(ne(productGroupLocales.publishStatus, "archived"), lte(productGroupLocales.scheduledArchiveAt, now)))
      .returning({ entityId: productGroupLocales.productGroupId, locale: productGroupLocales.locale });
    const productGroupsResult = await finish("product_group", groupPublished, groupArchived);

    const locationPublished = await transaction.update(locationLocales).set({ publishStatus: "published", publishedAt: now, scheduledPublishAt: null })
      .where(and(eq(locationLocales.publishStatus, "draft"), lte(locationLocales.scheduledPublishAt, now)))
      .returning({ entityId: locationLocales.locationId, locale: locationLocales.locale });
    const locationArchived = await transaction.update(locationLocales).set({ publishStatus: "archived", scheduledArchiveAt: null })
      .where(and(ne(locationLocales.publishStatus, "archived"), lte(locationLocales.scheduledArchiveAt, now)))
      .returning({ entityId: locationLocales.locationId, locale: locationLocales.locale });
    const locationsResult = await finish("location", locationPublished, locationArchived);

    const departmentPublished = await transaction.update(departmentLocales).set({ publishStatus: "published", publishedAt: now, scheduledPublishAt: null })
      .where(and(eq(departmentLocales.publishStatus, "draft"), lte(departmentLocales.scheduledPublishAt, now)))
      .returning({ entityId: departmentLocales.departmentId, locale: departmentLocales.locale });
    const departmentArchived = await transaction.update(departmentLocales).set({ publishStatus: "archived", scheduledArchiveAt: null })
      .where(and(ne(departmentLocales.publishStatus, "archived"), lte(departmentLocales.scheduledArchiveAt, now)))
      .returning({ entityId: departmentLocales.departmentId, locale: departmentLocales.locale });
    const departmentsResult = await finish("department", departmentPublished, departmentArchived);

    const mediaPublished = await transaction.update(mediaLocales).set({ publishStatus: "published", publishedAt: now, scheduledPublishAt: null })
      .where(and(eq(mediaLocales.publishStatus, "draft"), lte(mediaLocales.scheduledPublishAt, now)))
      .returning({ entityId: mediaLocales.mediaId, locale: mediaLocales.locale });
    const mediaArchived = await transaction.update(mediaLocales).set({ publishStatus: "archived", scheduledArchiveAt: null })
      .where(and(ne(mediaLocales.publishStatus, "archived"), lte(mediaLocales.scheduledArchiveAt, now)))
      .returning({ entityId: mediaLocales.mediaId, locale: mediaLocales.locale });
    const mediaResult = await finish("media", mediaPublished, mediaArchived);

    const jobPublished = await transaction.update(jobPostingLocales).set({ publishStatus: "published", publishedAt: now, scheduledPublishAt: null })
      .where(and(eq(jobPostingLocales.publishStatus, "draft"), lte(jobPostingLocales.scheduledPublishAt, now)))
      .returning({ entityId: jobPostingLocales.jobPostingId, locale: jobPostingLocales.locale });
    const jobArchived = await transaction.update(jobPostingLocales).set({ publishStatus: "archived", scheduledArchiveAt: null })
      .where(and(ne(jobPostingLocales.publishStatus, "archived"), lte(jobPostingLocales.scheduledArchiveAt, now)))
      .returning({ entityId: jobPostingLocales.jobPostingId, locale: jobPostingLocales.locale });
    const jobPostingsResult = await finish("job_posting", jobPublished, jobArchived);
    return {
      pages: pagesResult,
      brands: brandsResult,
      productGroups: productGroupsResult,
      locations: locationsResult,
      departments: departmentsResult,
      media: mediaResult,
      jobPostings: jobPostingsResult,
    };
  }).catch((error) => {
    securityLogger.error("content.scheduler_failed", { error });
    throw error;
  });
}
