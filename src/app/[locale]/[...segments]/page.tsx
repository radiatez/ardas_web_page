import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  LegalPageShell,
  type LegalRouteKey,
} from "@/components/public/legal-page-shell";
import { publicShellCopy } from "@/content/public-shell";
import { isLocale } from "@/i18n/config";
import { getRouteByPath } from "@/i18n/routes";

type CatchAllPageProps = {
  params: Promise<{ locale: string; segments: string[] }>;
};

const legalRouteKeys = new Set<LegalRouteKey>([
  "privacy",
  "cookies",
  "data-protection",
]);

async function resolveLegalRoute({ params }: CatchAllPageProps) {
  const { locale, segments } = await params;
  if (!isLocale(locale)) return undefined;

  const route = getRouteByPath(`/${locale}/${segments.join("/")}`);
  if (!route || !legalRouteKeys.has(route.routeKey as LegalRouteKey)) {
    return undefined;
  }

  return { locale, routeKey: route.routeKey as LegalRouteKey };
}

export async function generateMetadata(
  props: CatchAllPageProps,
): Promise<Metadata> {
  const route = await resolveLegalRoute(props);
  if (!route) return {};

  return {
    title: publicShellCopy[route.locale].legal[route.routeKey].title,
    robots: { index: false, follow: false },
  };
}

export default async function CatchAllPage(props: CatchAllPageProps) {
  const route = await resolveLegalRoute(props);
  if (!route) notFound();

  return <LegalPageShell locale={route.locale} routeKey={route.routeKey} />;
}
