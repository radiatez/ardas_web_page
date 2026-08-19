import type { Route } from "next";

import type { Locale } from "./config";

export const routeKeys = [
  "home",
  "corporate",
  "brands",
  "product-groups",
  "locations",
  "careers",
  "career-apply",
  "contact",
  "privacy",
  "cookies",
  "data-protection",
] as const;

export type RouteKey = (typeof routeKeys)[number];

type RouteDefinition = Readonly<Record<Locale, string>>;

export const routeDefinitions = {
  home: { tr: "", en: "" },
  corporate: { tr: "kurumsal", en: "corporate" },
  brands: { tr: "markalar", en: "brands" },
  "product-groups": { tr: "urun-gruplari", en: "product-groups" },
  locations: { tr: "depolar", en: "locations" },
  careers: { tr: "kariyer", en: "careers" },
  "career-apply": { tr: "kariyer/basvuru", en: "careers/apply" },
  contact: { tr: "iletisim", en: "contact" },
  privacy: { tr: "gizlilik", en: "privacy" },
  cookies: { tr: "cerez-politikasi", en: "cookie-policy" },
  "data-protection": { tr: "kvkk", en: "data-protection" },
} as const satisfies Record<RouteKey, RouteDefinition>;

export function getLocalizedPath(routeKey: RouteKey, locale: Locale): Route {
  const slug = routeDefinitions[routeKey][locale];
  return (slug ? `/${locale}/${slug}` : `/${locale}`) as Route;
}

export function getRouteByPath(
  path: string,
): { locale: Locale; routeKey: RouteKey } | undefined {
  for (const routeKey of routeKeys) {
    for (const locale of ["tr", "en"] as const) {
      if (getLocalizedPath(routeKey, locale) === path) {
        return { locale, routeKey };
      }
    }
  }

  return undefined;
}

export function getLanguageSwitchTarget(
  routeKey: RouteKey,
  targetLocale: Locale,
  equivalentIsPublished: boolean,
): Route {
  return equivalentIsPublished
    ? getLocalizedPath(routeKey, targetLocale)
    : getLocalizedPath("home", targetLocale);
}
