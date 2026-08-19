import type { Metadata } from "next";
import type { Route } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import {
  LegalPageShell,
} from "@/components/public/legal-page-shell";
import { CorePublicPage } from "@/components/public/core-public-page";
import {
  isPublicPageRouteKey,
  type PublicPageRouteKey,
} from "@/content/public-pages";
import { isLocale } from "@/i18n/config";
import { getRouteByPath } from "@/i18n/routes";
import { getCachedPublicPageBundle } from "@/public/content-repository";
import { buildPublicPageMetadata } from "@/public/metadata";
import { resolveActiveSlugRedirect } from "@/admin/cms";
import { getRuntimeDatabase } from "@/db/runtime";

type CatchAllPageProps = {
  params: Promise<{ locale: string; segments: string[] }>;
};

const legalRouteKeys = new Set<PublicPageRouteKey>([
  "privacy",
  "cookies",
  "data-protection",
]);

async function resolvePublicRoute({ params }: CatchAllPageProps) {
  const { locale, segments } = await params;
  if (!isLocale(locale)) return undefined;

  const route = getRouteByPath(`/${locale}/${segments.join("/")}`);
  if (!route || !isPublicPageRouteKey(route.routeKey) || route.routeKey === "home") {
    return undefined;
  }

  return { locale, routeKey: route.routeKey };
}

export async function generateMetadata(
  props: CatchAllPageProps,
): Promise<Metadata> {
  const route = await resolvePublicRoute(props);
  if (!route) return {};
  const bundle = await getCachedPublicPageBundle(route.routeKey, route.locale);
  return bundle ? buildPublicPageMetadata(bundle.page) : {};
}

export default async function CatchAllPage(props: CatchAllPageProps) {
  const route = await resolvePublicRoute(props);
  if (!route) {
    const { locale, segments } = await props.params;
    if (isLocale(locale)) {
      try {
        const { db } = getRuntimeDatabase();
        const redirect = await resolveActiveSlugRedirect(db, `/${locale}/${segments.join("/")}`);
        if (redirect?.status === 301) permanentRedirect(redirect.newPath as Route);
      } catch (error) {
        if (typeof error === "object" && error && "digest" in error) throw error;
      }
    }
    notFound();
  }
  const bundle = await getCachedPublicPageBundle(route.routeKey, route.locale);
  if (!bundle) notFound();

  return legalRouteKeys.has(route.routeKey) ? (
    <LegalPageShell controllerDetails={bundle.legalController} page={bundle.page} />
  ) : (
    <CorePublicPage bundle={bundle} />
  );
}
