import { redirect } from "next/navigation";

import { isPublicPageRouteKey } from "@/content/public-pages";
import { isLocale, type Locale } from "@/i18n/config";
import { getLanguageSwitchTarget, routeKeys, type RouteKey } from "@/i18n/routes";
import { getCachedPublicPageBundle } from "@/public/content-repository";

type LocaleSwitchRouteProps = {
  params: Promise<{ locale: string; routeKey: string }>;
};

export function resolveLocaleSwitchDestination(
  routeKey: RouteKey,
  targetLocale: Locale,
  equivalentIsPublished: boolean,
) {
  return getLanguageSwitchTarget(routeKey, targetLocale, equivalentIsPublished);
}

export async function GET(_request: Request, { params }: LocaleSwitchRouteProps) {
  const { locale, routeKey } = await params;
  if (!isLocale(locale) || !routeKeys.includes(routeKey as RouteKey)) {
    redirect("/tr");
  }

  const typedRouteKey = routeKey as RouteKey;
  const equivalent = isPublicPageRouteKey(typedRouteKey)
    ? await getCachedPublicPageBundle(typedRouteKey, locale)
    : undefined;

  redirect(
    resolveLocaleSwitchDestination(typedRouteKey, locale, Boolean(equivalent)),
  );
}
