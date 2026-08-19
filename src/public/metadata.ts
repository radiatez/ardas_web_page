import type { Metadata } from "next";

import type { PublicPageDocument } from "@/content/public-pages";
import { getLocalizedPath } from "@/i18n/routes";

const socialLocales = {
  tr: "tr_TR",
  en: "en_US",
} as const;

export function resolveMetadataBaseUrl(
  siteUrl = process.env.SITE_URL,
  appEnvironment = process.env.APP_ENV,
): URL | undefined {
  if (!siteUrl) {
    return appEnvironment === "local" ? new URL("http://localhost:3000") : undefined;
  }

  try {
    const url = new URL(siteUrl);
    const localHttp =
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1");
    if ((url.protocol !== "https:" && !localHttp) || url.username || url.password) {
      return undefined;
    }
    return url;
  } catch {
    return undefined;
  }
}

export function buildPublicPageMetadata(page: PublicPageDocument): Metadata {
  const canonical = getLocalizedPath(page.routeKey, page.locale);
  const languages = Object.fromEntries(
    page.availableLocales.map((locale) => [
      locale,
      getLocalizedPath(page.routeKey, locale),
    ]),
  );
  const defaultLocale = page.availableLocales.includes("tr") ? "tr" : page.locale;

  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription,
    alternates: {
      canonical,
      languages: {
        ...languages,
        "x-default": getLocalizedPath(page.routeKey, defaultLocale),
      },
    },
    robots:
      page.source === "cms" && page.allowIndexing !== false
        ? { index: true, follow: true }
        : { index: false, follow: false, noarchive: true },
    openGraph: {
      type: "website",
      title: page.ogTitle ?? page.seoTitle ?? page.title,
      description: page.ogDescription ?? page.seoDescription,
      url: canonical,
      locale: socialLocales[page.locale],
      alternateLocale: page.availableLocales
        .filter((locale) => locale !== page.locale)
        .map((locale) => socialLocales[locale]),
      siteName: "ARDAŞ",
      images: page.ogImage ? [page.ogImage] : undefined,
    },
    twitter: {
      card: "summary",
      title: page.ogTitle ?? page.seoTitle ?? page.title,
      description: page.ogDescription ?? page.seoDescription,
    },
  };
}
