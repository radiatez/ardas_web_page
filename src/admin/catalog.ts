import { and, asc, eq, sql } from "drizzle-orm";

import type { DatabaseClient } from "@/db/client";
import {
  brandLocales,
  brands,
  contentRevisions,
  contentDrafts,
  departmentLocales,
  departments,
  locationLocales,
  locations,
  productGroupLocales,
  productGroups,
  slugRedirects,
} from "@/db/schema";
import { isLocale, type Locale } from "@/i18n/config";
import { routeDefinitions } from "@/i18n/routes";
import { appendAuditEvent } from "@/security/audit";
import { InvalidSecurityInputError, ResourceNotFoundError } from "@/security/errors";
import { assertAuthorized, type AdminPrincipal } from "@/security/rbac/authorization";
import type { PermissionKey, PermissionScope } from "@/security/rbac/catalog";

export const adminCatalogKinds = ["brands", "product-groups", "locations", "departments"] as const;
export type AdminCatalogKind = (typeof adminCatalogKinds)[number];

const catalogEntityType: Record<AdminCatalogKind, string> = {
  brands: "brand",
  "product-groups": "product_group",
  locations: "location",
  departments: "department",
};

type CatalogInput = {
  id?: string;
  locale: Locale;
  key?: string;
  name: string;
  description?: string | null;
  workingHours?: string | null;
  slug?: string | null;
  featured?: boolean;
  sortOrder?: number;
  status?: "active" | "inactive" | "archived";
  mediaId?: string | null;
  addressData?: Record<string, unknown> | null;
  contactData?: Record<string, unknown> | null;
};

const permissionResource = {
  brands: "Brands",
  "product-groups": "ProductGroups",
  locations: "Locations",
  departments: "Departments",
} as const;

function catalogPermission(kind: AdminCatalogKind, action: "view" | "create" | "edit" | "publish") {
  return `${permissionResource[kind]}:${action}` as PermissionKey;
}

function assertCatalogPermission(
  principal: AdminPrincipal | null,
  kind: AdminCatalogKind,
  action: "view" | "create" | "edit" | "publish",
  scope?: PermissionScope,
): asserts principal is AdminPrincipal {
  assertAuthorized(principal, {
    permission: catalogPermission(kind, action),
    scope,
    environment: process.env.APP_ENV,
  });
}

function text(value: string | null | undefined, max: number, required = false) {
  const normalized = value?.trim() ?? "";
  if ((required && !normalized) || normalized.length > max) {
    throw new InvalidSecurityInputError("catalog_text_invalid");
  }
  return normalized || null;
}

function key(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || !/^[a-z0-9][a-z0-9-]{1,118}[a-z0-9]$/.test(normalized)) {
    throw new InvalidSecurityInputError("catalog_key_invalid");
  }
  return normalized;
}

function slug(value: string | null | undefined) {
  const normalized = value?.trim().toLocaleLowerCase("tr-TR");
  if (!normalized || !/^[a-z0-9çğıöşü]+(?:-[a-z0-9çğıöşü]+)*$/i.test(normalized) || normalized.length > 255) {
    throw new InvalidSecurityInputError("catalog_slug_invalid");
  }
  return normalized;
}

function numericSort(value: number | undefined) {
  const result = value ?? 0;
  if (!Number.isSafeInteger(result) || result < -10_000 || result > 10_000) {
    throw new InvalidSecurityInputError("catalog_sort_invalid");
  }
  return result;
}

async function appendCatalogRevision(
  db: Parameters<Parameters<DatabaseClient["transaction"]>[0]>[0],
  entityType: string,
  entityId: string,
  locale: Locale,
  snapshot: Record<string, unknown>,
  actorUserId: string,
) {
  const [latest] = await db.select({ revisionNo: sql<number>`coalesce(max(${contentRevisions.revisionNo}), 0)` })
    .from(contentRevisions).where(and(
      eq(contentRevisions.entityType, entityType),
      eq(contentRevisions.entityId, entityId),
      eq(contentRevisions.locale, locale),
    ));
  const revisionNo = Number(latest?.revisionNo ?? 0) + 1;
  await db.insert(contentRevisions).values({
    entityType,
    entityId,
    locale,
    revisionNo,
    snapshot,
    createdBy: actorUserId,
  });
  return revisionNo;
}

export async function listAdminCatalog(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  kind: AdminCatalogKind,
) {
  assertCatalogPermission(principal, kind, "view");
  switch (kind) {
    case "brands":
      return db.select({ id: brands.id, key: brands.name, slug: sql<string | null>`null`, locale: brandLocales.locale, name: brands.name,
        description: brandLocales.shortDescription, status: brands.status,
        publishStatus: brandLocales.publishStatus, sortOrder: brands.sortOrder })
        .from(brands).leftJoin(brandLocales, eq(brandLocales.brandId, brands.id))
        .orderBy(asc(brands.sortOrder), asc(brands.name));
    case "product-groups":
      return db.select({ id: productGroups.id, key: productGroups.key, slug: productGroupLocales.slug, locale: productGroupLocales.locale,
        name: productGroupLocales.name, description: productGroupLocales.shortDescription,
        status: productGroups.status, publishStatus: productGroupLocales.publishStatus,
        sortOrder: productGroups.sortOrder })
        .from(productGroups).leftJoin(productGroupLocales, eq(productGroupLocales.productGroupId, productGroups.id))
        .orderBy(asc(productGroups.sortOrder), asc(productGroups.key));
    case "locations":
      return db.select({ id: locations.id, key: locations.key, slug: sql<string | null>`null`, locale: locationLocales.locale,
        name: locationLocales.name, description: locationLocales.description,
        status: locations.status, publishStatus: locationLocales.publishStatus,
        sortOrder: locations.sortOrder })
        .from(locations).leftJoin(locationLocales, eq(locationLocales.locationId, locations.id))
        .orderBy(asc(locations.sortOrder), asc(locations.key));
    case "departments":
      return db.select({ id: departments.id, key: departments.key, slug: sql<string | null>`null`, locale: departmentLocales.locale,
        name: departmentLocales.name, description: departmentLocales.description,
        status: departments.status, publishStatus: departmentLocales.publishStatus,
        sortOrder: departments.sortOrder })
        .from(departments).leftJoin(departmentLocales, eq(departmentLocales.departmentId, departments.id))
        .orderBy(asc(departments.sortOrder), asc(departments.key));
  }
}

export async function saveAdminCatalogItem(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  kind: AdminCatalogKind,
  raw: CatalogInput,
) {
  if (!isLocale(raw.locale)) throw new InvalidSecurityInputError("catalog_locale_invalid");
  assertCatalogPermission(
    principal,
    kind,
    raw.id ? "edit" : "create",
    kind === "departments" ? "public_locale" : undefined,
  );
  const input = {
    ...raw,
    name: text(raw.name, 255, true)!,
    description: text(raw.description, 4_000),
    workingHours: text(raw.workingHours, 1_000),
    sortOrder: numericSort(raw.sortOrder),
    status: raw.status ?? "active" as const,
  };
  return db.transaction(async (transaction) => {
    let entityId: string;
    let snapshot: Record<string, unknown>;
    if (kind === "brands") {
      const [entity] = raw.id
        ? await transaction.select({ id: brands.id }).from(brands).where(eq(brands.id, raw.id)).limit(1)
        : await transaction.insert(brands).values({ name: input.name, featured: raw.featured ?? false,
            sortOrder: input.sortOrder, status: input.status, logoMediaId: raw.mediaId ?? null }).returning({ id: brands.id });
      if (!entity) throw new ResourceNotFoundError();
      entityId = entity.id;
      const [localeRow] = await transaction.select({ id: brandLocales.brandId }).from(brandLocales)
        .where(and(eq(brandLocales.brandId, entityId), eq(brandLocales.locale, input.locale))).limit(1);
      if (!localeRow) await transaction.insert(brandLocales).values({ brandId: entityId, locale: input.locale,
        shortDescription: input.description, publishStatus: "draft" });
      snapshot = { name: input.name, featured: raw.featured ?? false, sortOrder: input.sortOrder,
        status: input.status, mediaId: raw.mediaId ?? null, description: input.description };
    } else if (kind === "product-groups") {
      const normalizedKey = key(raw.key);
      const normalizedSlug = slug(raw.slug);
      const [entity] = raw.id
        ? await transaction.select({ id: productGroups.id }).from(productGroups).where(eq(productGroups.id, raw.id)).limit(1)
        : await transaction.insert(productGroups).values({ key: normalizedKey, sortOrder: input.sortOrder,
            status: input.status, imageMediaId: raw.mediaId ?? null }).returning({ id: productGroups.id });
      if (!entity) throw new ResourceNotFoundError();
      entityId = entity.id;
      const [localeRow] = await transaction.select({ id: productGroupLocales.productGroupId }).from(productGroupLocales)
        .where(and(eq(productGroupLocales.productGroupId, entityId), eq(productGroupLocales.locale, input.locale))).limit(1);
      if (!localeRow) await transaction.insert(productGroupLocales).values({ productGroupId: entityId, locale: input.locale,
        name: input.name, slug: normalizedSlug, shortDescription: input.description, publishStatus: "draft" });
      snapshot = { key: normalizedKey, name: input.name, slug: normalizedSlug, description: input.description,
        sortOrder: input.sortOrder, status: input.status, mediaId: raw.mediaId ?? null };
    } else if (kind === "locations") {
      const normalizedKey = key(raw.key);
      const [entity] = raw.id
        ? await transaction.select({ id: locations.id }).from(locations).where(eq(locations.id, raw.id)).limit(1)
        : await transaction.insert(locations).values({ key: normalizedKey, addressData: raw.addressData,
            contactData: raw.contactData, mediaId: raw.mediaId ?? null, sortOrder: input.sortOrder, status: input.status }).returning({ id: locations.id });
      if (!entity) throw new ResourceNotFoundError();
      entityId = entity.id;
      const [localeRow] = await transaction.select({ id: locationLocales.locationId }).from(locationLocales)
        .where(and(eq(locationLocales.locationId, entityId), eq(locationLocales.locale, input.locale))).limit(1);
      if (!localeRow) await transaction.insert(locationLocales).values({ locationId: entityId, locale: input.locale,
        name: input.name, description: input.description, workingHoursText: input.workingHours, publishStatus: "draft" });
      snapshot = { key: normalizedKey, name: input.name, description: input.description,
        workingHours: input.workingHours, sortOrder: input.sortOrder, status: input.status,
        mediaId: raw.mediaId ?? null, addressData: raw.addressData ?? null, contactData: raw.contactData ?? null };
    } else {
      const normalizedKey = key(raw.key);
      const [entity] = raw.id
        ? await transaction.select({ id: departments.id }).from(departments).where(eq(departments.id, raw.id)).limit(1)
        : await transaction.insert(departments).values({ key: normalizedKey, sortOrder: input.sortOrder, status: input.status })
            .returning({ id: departments.id });
      if (!entity) throw new ResourceNotFoundError();
      entityId = entity.id;
      const [localeRow] = await transaction.select({ id: departmentLocales.departmentId }).from(departmentLocales)
        .where(and(eq(departmentLocales.departmentId, entityId), eq(departmentLocales.locale, input.locale))).limit(1);
      if (!localeRow) await transaction.insert(departmentLocales).values({ departmentId: entityId, locale: input.locale,
        name: input.name, description: input.description, publishStatus: "draft" });
      snapshot = { key: normalizedKey, name: input.name, description: input.description,
        sortOrder: input.sortOrder, status: input.status };
    }
    await transaction.insert(contentDrafts).values({ entityType: catalogEntityType[kind], entityId, locale: input.locale,
      snapshot, updatedBy: principal.userId, updatedAt: new Date() }).onConflictDoUpdate({
      target: [contentDrafts.entityType, contentDrafts.entityId, contentDrafts.locale],
      set: { snapshot, updatedBy: principal.userId, updatedAt: new Date() },
    });
    const revisionNo = await appendCatalogRevision(transaction, catalogEntityType[kind], entityId,
      input.locale, snapshot, principal.userId);
    await appendAuditEvent(transaction, { actorUserId: principal.userId, eventType: "content.catalog_saved",
      resourceType: permissionResource[kind].toLowerCase(), resourceId: entityId,
      metadata: { kind, locale: input.locale, revisionNo } });
    return { id: entityId, locale: input.locale, revisionNo };
  });
}

export async function publishAdminCatalogItem(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  kind: AdminCatalogKind,
  id: string,
  locale: Locale,
  action: "publish" | "archive",
) {
  if (!isLocale(locale)) throw new InvalidSecurityInputError("catalog_locale_invalid");
  if (kind === "departments") {
    assertCatalogPermission(principal, kind, "edit", "public_locale");
  } else {
    assertCatalogPermission(principal, kind, "publish");
  }
  const now = new Date();
  return db.transaction(async (transaction) => {
    const [draft] = await transaction.select({ snapshot: contentDrafts.snapshot }).from(contentDrafts)
      .where(and(eq(contentDrafts.entityType, catalogEntityType[kind]), eq(contentDrafts.entityId, id), eq(contentDrafts.locale, locale))).limit(1);
    const snapshot = draft?.snapshot;
    const desiredName = snapshot && typeof snapshot.name === "string" ? snapshot.name : undefined;
    const update = action === "publish"
      ? { publishStatus: "published" as const, publishedAt: now, scheduledPublishAt: null }
      : { publishStatus: "archived" as const, scheduledArchiveAt: null };
    let rows: { id: string }[];
    if (kind === "brands") {
      if (action === "publish" && snapshot && desiredName) {
        await transaction.update(brands).set({ name: desiredName, featured: snapshot.featured === true,
          sortOrder: Number(snapshot.sortOrder ?? 0), status: snapshot.status === "archived" ? "archived" : snapshot.status === "inactive" ? "inactive" : "active",
          logoMediaId: typeof snapshot.mediaId === "string" ? snapshot.mediaId : null }).where(eq(brands.id, id));
      }
      rows = await transaction.update(brandLocales).set({ ...update,
        ...(action === "publish" && snapshot ? { shortDescription: typeof snapshot.description === "string" ? snapshot.description : null } : {}) })
        .where(and(eq(brandLocales.brandId, id), eq(brandLocales.locale, locale))).returning({ id: brandLocales.brandId });
    } else if (kind === "product-groups") {
      const [old] = await transaction.select({ slug: productGroupLocales.slug, status: productGroupLocales.publishStatus })
        .from(productGroupLocales).where(and(eq(productGroupLocales.productGroupId, id), eq(productGroupLocales.locale, locale))).limit(1);
      if (action === "publish" && snapshot && desiredName && typeof snapshot.key === "string" && typeof snapshot.slug === "string") {
        await transaction.update(productGroups).set({ key: snapshot.key, sortOrder: Number(snapshot.sortOrder ?? 0),
          status: snapshot.status === "archived" ? "archived" : snapshot.status === "inactive" ? "inactive" : "active",
          imageMediaId: typeof snapshot.mediaId === "string" ? snapshot.mediaId : null }).where(eq(productGroups.id, id));
        if (old?.status === "published" && old.slug !== snapshot.slug) {
          const base = routeDefinitions["product-groups"][locale];
          await transaction.insert(slugRedirects).values({ locale, entityType: "product_group", entityId: id,
            oldPath: `/${locale}/${base}/${old.slug}`, newPath: `/${locale}/${base}/${snapshot.slug}` })
            .onConflictDoUpdate({ target: slugRedirects.oldPath, set: { newPath: `/${locale}/${base}/${snapshot.slug}`, disabledAt: null } });
        }
      }
      rows = await transaction.update(productGroupLocales).set({ ...update,
        ...(action === "publish" && snapshot && desiredName && typeof snapshot.slug === "string" ? {
          name: desiredName, slug: snapshot.slug, shortDescription: typeof snapshot.description === "string" ? snapshot.description : null } : {}) })
        .where(and(eq(productGroupLocales.productGroupId, id), eq(productGroupLocales.locale, locale))).returning({ id: productGroupLocales.productGroupId });
    } else if (kind === "locations") {
      if (action === "publish" && snapshot && desiredName && typeof snapshot.key === "string") {
        await transaction.update(locations).set({ key: snapshot.key, sortOrder: Number(snapshot.sortOrder ?? 0),
          status: snapshot.status === "archived" ? "archived" : snapshot.status === "inactive" ? "inactive" : "active",
          mediaId: typeof snapshot.mediaId === "string" ? snapshot.mediaId : null,
          addressData: snapshot.addressData && typeof snapshot.addressData === "object" ? snapshot.addressData as Record<string, unknown> : null,
          contactData: snapshot.contactData && typeof snapshot.contactData === "object" ? snapshot.contactData as Record<string, unknown> : null }).where(eq(locations.id, id));
      }
      rows = await transaction.update(locationLocales).set({ ...update,
        ...(action === "publish" && snapshot && desiredName ? { name: desiredName,
          description: typeof snapshot.description === "string" ? snapshot.description : null,
          workingHoursText: typeof snapshot.workingHours === "string" ? snapshot.workingHours : null } : {}) })
        .where(and(eq(locationLocales.locationId, id), eq(locationLocales.locale, locale))).returning({ id: locationLocales.locationId });
    } else {
      if (action === "publish" && snapshot && desiredName && typeof snapshot.key === "string") {
        await transaction.update(departments).set({ key: snapshot.key, sortOrder: Number(snapshot.sortOrder ?? 0),
          status: snapshot.status === "archived" ? "archived" : snapshot.status === "inactive" ? "inactive" : "active" }).where(eq(departments.id, id));
      }
      rows = await transaction.update(departmentLocales).set({ ...update,
        ...(action === "publish" && snapshot && desiredName ? { name: desiredName,
          description: typeof snapshot.description === "string" ? snapshot.description : null } : {}) })
        .where(and(eq(departmentLocales.departmentId, id), eq(departmentLocales.locale, locale))).returning({ id: departmentLocales.departmentId });
    }
    if (!rows[0]) throw new ResourceNotFoundError();
    if (action === "publish" && draft) await transaction.delete(contentDrafts).where(and(
      eq(contentDrafts.entityType, catalogEntityType[kind]), eq(contentDrafts.entityId, id), eq(contentDrafts.locale, locale)));
    if (snapshot) await appendCatalogRevision(transaction, catalogEntityType[kind], id, locale,
      { ...snapshot, publishStatus: action === "publish" ? "published" : "archived", publishedAt: action === "publish" ? now.toISOString() : null }, principal.userId);
    await appendAuditEvent(transaction, { actorUserId: principal.userId, eventType: `content.catalog_${action}`,
      resourceType: permissionResource[kind].toLowerCase(), resourceId: id, metadata: { kind, locale } });
    return { id, locale, action };
  });
}
