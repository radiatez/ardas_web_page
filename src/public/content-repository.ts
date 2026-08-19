import { and, asc, eq, inArray } from "drizzle-orm";
import { cache } from "react";

import {
  developmentContentIsEnabled,
  type DevelopmentContentEnvironment,
} from "@/content/development-content";
import { getTemporaryMediaMap } from "@/content/demo-media";
import {
  getDevelopmentPage,
  getStructuralPage,
  parsePublicPageContent,
  type PublicPageDocument,
  type PublicPageRouteKey,
} from "@/content/public-pages";
import { isPubliclyAvailable } from "@/content/publication";
import type { DatabaseClient } from "@/db/client";
import { getRuntimeDatabase } from "@/db/runtime";
import {
  brandLocales,
  brands,
  locationLocales,
  locations,
  media,
  mediaLocales,
  pageLocales,
  pages,
  productGroupLocales,
  productGroups,
} from "@/db/schema";
import type { Locale } from "@/i18n/config";
import { routeDefinitions } from "@/i18n/routes";
import {
  loadLegalControllerDetails,
  type LegalControllerDetails,
} from "@/public/legal-controller";
import { securityLogger } from "@/security/logging";

export { developmentContentIsEnabled } from "@/content/development-content";

export type PublicMediaPresentation = {
  id: string;
  src: string;
  width: number;
  height: number;
  focalX: number | null;
  focalY: number | null;
  mediaLocale: {
    locale: Locale;
    altText: string | null;
    caption: string | null;
  };
};

export type PublicBrand = {
  id: string;
  name: string;
  description: string | null;
  featured: boolean;
  media: PublicMediaPresentation | null;
};

export type PublicProductGroup = {
  id: string;
  key: string;
  name: string;
  slug: string;
  description: string | null;
  media: PublicMediaPresentation | null;
};

export type PublicLocation = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  workingHours: string | null;
  media: PublicMediaPresentation | null;
};

export type PublicPageBundle = {
  page: PublicPageDocument;
  blockMedia: Readonly<Record<string, PublicMediaPresentation>>;
  brands: readonly PublicBrand[];
  productGroups: readonly PublicProductGroup[];
  locations: readonly PublicLocation[];
  legalController?: LegalControllerDetails;
};

type RuntimeEnvironment = DevelopmentContentEnvironment & {
  PUBLIC_MEDIA_BASE_URL?: string;
};

export function resolvePublicMediaUrl(
  storageKey: string,
  baseUrl = process.env.PUBLIC_MEDIA_BASE_URL,
): string | undefined {
  if (!baseUrl || !storageKey || storageKey.startsWith("/")) return undefined;

  try {
    const base = new URL(baseUrl);
    if (
      base.protocol !== "https:" ||
      base.username ||
      base.password ||
      base.search ||
      base.hash
    ) {
      return undefined;
    }
    const segments = storageKey.split("/");
    if (
      segments.some(
        (segment) =>
          !segment ||
          segment === "." ||
          segment === ".." ||
          segment.includes("\\") ||
          /[\u0000-\u001f]/.test(segment),
      )
    ) {
      return undefined;
    }
    base.pathname = `${base.pathname.replace(/\/$/, "")}/${segments
      .map(encodeURIComponent)
      .join("/")}`;
    return base.toString();
  } catch {
    return undefined;
  }
}

function toPublication(row: {
  locale: Locale;
  publishStatus: "draft" | "published" | "archived";
  publishedAt: Date | null;
  scheduledArchiveAt: Date | null;
}) {
  return row;
}

async function loadPage(
  db: DatabaseClient,
  routeKey: PublicPageRouteKey,
  locale: Locale,
  now: Date,
): Promise<PublicPageDocument | undefined> {
  const rows = await db
    .select({
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
      publishStatus: pageLocales.publishStatus,
      publishedAt: pageLocales.publishedAt,
      scheduledArchiveAt: pageLocales.scheduledArchiveAt,
    })
    .from(pages)
    .innerJoin(pageLocales, eq(pageLocales.pageId, pages.id))
    .where(eq(pages.routeKey, routeKey));

  const availableLocales = rows
    .filter(
      (row) =>
        row.slug === routeDefinitions[routeKey][row.locale] &&
        isPubliclyAvailable(toPublication(row), now),
    )
    .map((row) => row.locale);
  const selected = rows.find(
    (row) =>
      row.locale === locale &&
      row.slug === routeDefinitions[routeKey][locale] &&
      isPubliclyAvailable(toPublication(row), now),
  );

  if (!selected) return undefined;

  return {
    routeKey,
    locale,
    slug: selected.slug,
    title: selected.title,
    seoTitle: selected.seoTitle ?? undefined,
    seoDescription: selected.seoDescription ?? undefined,
    ogTitle: selected.ogTitle ?? undefined,
    ogDescription: selected.ogDescription ?? undefined,
    ogMediaId: selected.ogMediaId ?? undefined,
    allowIndexing: selected.allowIndexing,
    content: parsePublicPageContent(selected.contentJson, selected.title),
    source: "cms",
    availableLocales,
  };
}

async function loadMediaMap(
  db: DatabaseClient,
  mediaIds: readonly string[],
  locale: Locale,
  now: Date,
  mediaBaseUrl?: string,
): Promise<Map<string, PublicMediaPresentation>> {
  const uniqueIds = [...new Set(mediaIds)].filter(Boolean);
  if (uniqueIds.length === 0) return new Map();

  const rows = await db
    .select({
      id: media.id,
      storageKey: media.storageKey,
      width: media.width,
      height: media.height,
      focalX: media.focalX,
      focalY: media.focalY,
      locale: mediaLocales.locale,
      altText: mediaLocales.altText,
      caption: mediaLocales.caption,
      publishStatus: mediaLocales.publishStatus,
      publishedAt: mediaLocales.publishedAt,
      scheduledArchiveAt: mediaLocales.scheduledArchiveAt,
    })
    .from(media)
    .innerJoin(mediaLocales, eq(mediaLocales.mediaId, media.id))
    .where(
      and(
        inArray(media.id, uniqueIds),
        eq(media.storageClass, "public"),
        eq(mediaLocales.locale, locale),
      ),
    );

  const presentations = rows.flatMap((row) => {
    const src = resolvePublicMediaUrl(row.storageKey, mediaBaseUrl);
    if (
      !src ||
      !row.width ||
      !row.height ||
      !isPubliclyAvailable(toPublication(row), now)
    ) {
      return [];
    }
    return [
      [
        row.id,
        {
          id: row.id,
          src,
          width: row.width,
          height: row.height,
          focalX: row.focalX,
          focalY: row.focalY,
          mediaLocale: {
            locale: row.locale,
            altText: row.altText,
            caption: row.caption,
          },
        } satisfies PublicMediaPresentation,
      ] as const,
    ];
  });

  return new Map(presentations);
}

async function loadBrands(
  db: DatabaseClient,
  locale: Locale,
  now: Date,
  mediaBaseUrl?: string,
): Promise<readonly PublicBrand[]> {
  const rows = await db
    .select({
      id: brands.id,
      name: brands.name,
      featured: brands.featured,
      description: brandLocales.shortDescription,
      mediaId: brands.logoMediaId,
      locale: brandLocales.locale,
      publishStatus: brandLocales.publishStatus,
      publishedAt: brandLocales.publishedAt,
      scheduledArchiveAt: brandLocales.scheduledArchiveAt,
    })
    .from(brands)
    .innerJoin(brandLocales, eq(brandLocales.brandId, brands.id))
    .where(and(eq(brands.status, "active"), eq(brandLocales.locale, locale)))
    .orderBy(asc(brands.sortOrder), asc(brands.name));
  const published = rows.filter((row) =>
    isPubliclyAvailable(toPublication(row), now),
  );
  const mediaMap = await loadMediaMap(
    db,
    published.flatMap((row) => (row.mediaId ? [row.mediaId] : [])),
    locale,
    now,
    mediaBaseUrl,
  );
  return published.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    featured: row.featured,
    media: row.mediaId ? (mediaMap.get(row.mediaId) ?? null) : null,
  }));
}

async function loadProductGroups(
  db: DatabaseClient,
  locale: Locale,
  now: Date,
  mediaBaseUrl?: string,
): Promise<readonly PublicProductGroup[]> {
  const rows = await db
    .select({
      id: productGroups.id,
      key: productGroups.key,
      name: productGroupLocales.name,
      slug: productGroupLocales.slug,
      description: productGroupLocales.shortDescription,
      mediaId: productGroups.imageMediaId,
      locale: productGroupLocales.locale,
      publishStatus: productGroupLocales.publishStatus,
      publishedAt: productGroupLocales.publishedAt,
      scheduledArchiveAt: productGroupLocales.scheduledArchiveAt,
    })
    .from(productGroups)
    .innerJoin(
      productGroupLocales,
      eq(productGroupLocales.productGroupId, productGroups.id),
    )
    .where(
      and(
        eq(productGroups.status, "active"),
        eq(productGroupLocales.locale, locale),
      ),
    )
    .orderBy(asc(productGroups.sortOrder), asc(productGroupLocales.name));
  const published = rows.filter((row) =>
    isPubliclyAvailable(toPublication(row), now),
  );
  const mediaMap = await loadMediaMap(
    db,
    published.flatMap((row) => (row.mediaId ? [row.mediaId] : [])),
    locale,
    now,
    mediaBaseUrl,
  );
  return published.map((row) => ({
    id: row.id,
    key: row.key,
    name: row.name,
    slug: row.slug,
    description: row.description,
    media: row.mediaId ? (mediaMap.get(row.mediaId) ?? null) : null,
  }));
}

async function loadLocations(
  db: DatabaseClient,
  locale: Locale,
  now: Date,
  mediaBaseUrl?: string,
): Promise<readonly PublicLocation[]> {
  const rows = await db
    .select({
      id: locations.id,
      key: locations.key,
      name: locationLocales.name,
      description: locationLocales.description,
      workingHours: locationLocales.workingHoursText,
      mediaId: locations.mediaId,
      locale: locationLocales.locale,
      publishStatus: locationLocales.publishStatus,
      publishedAt: locationLocales.publishedAt,
      scheduledArchiveAt: locationLocales.scheduledArchiveAt,
    })
    .from(locations)
    .innerJoin(locationLocales, eq(locationLocales.locationId, locations.id))
    .where(
      and(eq(locations.status, "active"), eq(locationLocales.locale, locale)),
    )
    .orderBy(asc(locations.sortOrder), asc(locationLocales.name));
  const published = rows.filter((row) =>
    isPubliclyAvailable(toPublication(row), now),
  );
  const mediaMap = await loadMediaMap(
    db,
    published.flatMap((row) => (row.mediaId ? [row.mediaId] : [])),
    locale,
    now,
    mediaBaseUrl,
  );
  return published.map((row) => ({
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    workingHours: row.workingHours,
    media: row.mediaId ? (mediaMap.get(row.mediaId) ?? null) : null,
  }));
}

function getBlockMediaIds(page: PublicPageDocument): readonly string[] {
  return [
    page.content.hero,
    ...Object.values(page.content.sections),
    ...page.content.legalBlocks,
  ].flatMap((block) => (block.mediaId ? [block.mediaId] : [])).concat(page.ogMediaId ? [page.ogMediaId] : []);
}

export async function loadPublishedPageBundle(
  db: DatabaseClient,
  routeKey: PublicPageRouteKey,
  locale: Locale,
  options: { now?: Date; mediaBaseUrl?: string } = {},
): Promise<PublicPageBundle | undefined> {
  const now = options.now ?? new Date();
  const page = await loadPage(db, routeKey, locale, now);
  if (!page) return undefined;

  const blockMediaIds = getBlockMediaIds(page);
  const [blockMediaMap, brandItems, productGroupItems, locationItems, legalController] =
    await Promise.all([
      loadMediaMap(db, blockMediaIds, locale, now, options.mediaBaseUrl),
      routeKey === "home" || routeKey === "brands"
        ? loadBrands(db, locale, now, options.mediaBaseUrl)
        : Promise.resolve([]),
      routeKey === "home" || routeKey === "product-groups"
        ? loadProductGroups(db, locale, now, options.mediaBaseUrl)
        : Promise.resolve([]),
      routeKey === "home" || routeKey === "locations"
        ? loadLocations(db, locale, now, options.mediaBaseUrl)
        : Promise.resolve([]),
      routeKey === "data-protection"
        ? loadLegalControllerDetails(db)
        : Promise.resolve(undefined),
    ]);

  const temporaryMedia = getTemporaryMediaMap(locale);
  for (const mediaId of blockMediaIds) {
    const fallback = temporaryMedia[mediaId];
    if (!blockMediaMap.has(mediaId) && fallback) {
      blockMediaMap.set(mediaId, fallback);
    }
  }

  return {
    page: page.ogMediaId && blockMediaMap.has(page.ogMediaId)
      ? {
          ...page,
          ogImage: {
            url: blockMediaMap.get(page.ogMediaId)!.src,
            width: blockMediaMap.get(page.ogMediaId)!.width,
            height: blockMediaMap.get(page.ogMediaId)!.height,
            alt: blockMediaMap.get(page.ogMediaId)!.mediaLocale.altText ?? undefined,
          },
        }
      : page,
    blockMedia: Object.fromEntries(blockMediaMap),
    brands: brandItems,
    productGroups: productGroupItems,
    locations: locationItems,
    legalController,
  };
}

function createDevelopmentBundle(
  routeKey: PublicPageRouteKey,
  locale: Locale,
): PublicPageBundle {
  const locationNames = locale === "tr"
    ? ["İstanbul", "Ankara", "Diyarbakır"]
    : ["Istanbul", "Ankara", "Diyarbakır"];
  return {
    page: getDevelopmentPage(routeKey, locale),
    blockMedia: getTemporaryMediaMap(locale),
    brands: [],
    productGroups: [],
    locations:
      routeKey === "home" || routeKey === "locations"
        ? locationNames.map((name, index) => ({
            id: `development-location-${index + 1}`,
            key: ["istanbul", "ankara", "diyarbakir"][index]!,
            name,
            description: null,
            workingHours: null,
            media: null,
          }))
        : [],
  };
}

function createStructuralBundle(
  routeKey: PublicPageRouteKey,
  locale: Locale,
): PublicPageBundle {
  const locationNames = locale === "tr"
    ? ["İstanbul", "Ankara", "Diyarbakır"]
    : ["Istanbul", "Ankara", "Diyarbakır"];
  return {
    page: getStructuralPage(routeKey, locale),
    blockMedia: getTemporaryMediaMap(locale),
    brands: [],
    productGroups: [],
    locations:
      routeKey === "home" || routeKey === "locations"
        ? locationNames.map((name, index) => ({
            id: `structural-location-${index + 1}`,
            key: ["istanbul", "ankara", "diyarbakir"][index]!,
            name,
            description: null,
            workingHours: null,
            media: null,
          }))
        : [],
  };
}

export async function getPublicPageBundle(
  routeKey: PublicPageRouteKey,
  locale: Locale,
  environment: RuntimeEnvironment = process.env,
): Promise<PublicPageBundle | undefined> {
  try {
    const { db } = getRuntimeDatabase();
    const bundle = await loadPublishedPageBundle(db, routeKey, locale, {
      mediaBaseUrl: environment.PUBLIC_MEDIA_BASE_URL,
    });
    if (bundle) return bundle;
  } catch (error) {
    securityLogger.warn("public.content.structural-fallback", {
      routeKey,
      locale,
      error,
    });
  }

  return developmentContentIsEnabled(environment)
    ? createDevelopmentBundle(routeKey, locale)
    : createStructuralBundle(routeKey, locale);
}

export const getCachedPublicPageBundle = cache(
  (routeKey: PublicPageRouteKey, locale: Locale) =>
    getPublicPageBundle(routeKey, locale),
);
