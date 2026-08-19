import type { MetadataRoute } from "next";

import { publicPageRouteKeys } from "@/content/public-pages";
import { locales } from "@/i18n/config";
import { getLocalizedPath } from "@/i18n/routes";
import { getCachedPublicPageBundle } from "@/public/content-repository";
import { resolveMetadataBaseUrl } from "@/public/metadata";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = resolveMetadataBaseUrl();
  if (!baseUrl) return [];

  const candidates = publicPageRouteKeys.flatMap((routeKey) =>
    locales.map((locale) => ({ routeKey, locale })),
  );
  const bundles = await Promise.all(
    candidates.map(async (candidate) => ({
      ...candidate,
      bundle: await getCachedPublicPageBundle(candidate.routeKey, candidate.locale),
    })),
  );

  return bundles.flatMap(({ routeKey, locale, bundle }) => {
    if (!bundle || bundle.page.source !== "cms") return [];
    const url = new URL(getLocalizedPath(routeKey, locale), baseUrl);
    const languages = Object.fromEntries(
      bundle.page.availableLocales.map((availableLocale) => [
        availableLocale,
        new URL(getLocalizedPath(routeKey, availableLocale), baseUrl).toString(),
      ]),
    );
    return [
      {
        url: url.toString(),
        changeFrequency: routeKey === "home" ? "weekly" : "monthly",
        alternates: { languages },
      } satisfies MetadataRoute.Sitemap[number],
    ];
  });
}
