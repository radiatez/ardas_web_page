"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { getAlternateLocale, type Locale } from "@/i18n/config";
import {
  getLanguageSwitchTarget,
  getRouteByPath,
  type RouteKey,
} from "@/i18n/routes";

export function getLocaleSwitchHref(
  pathname: string,
  locale: Locale,
): { href: Route; targetLocale: Locale; routeKey: RouteKey } {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  const currentRoute = getRouteByPath(normalizedPath);
  const targetLocale = getAlternateLocale(locale);
  const routeKey = currentRoute?.routeKey ?? "home";

  return {
    href: getLanguageSwitchTarget(routeKey, targetLocale, Boolean(currentRoute)),
    targetLocale,
    routeKey,
  };
}

type LocaleSwitcherProps = {
  locale: Locale;
  label: string;
  compact?: boolean;
};

export function LocaleSwitcher({
  locale,
  label,
  compact = false,
}: LocaleSwitcherProps) {
  const pathname = usePathname();
  const { href, targetLocale } = getLocaleSwitchHref(pathname, locale);

  return (
    <Link
      aria-label={
        locale === "tr"
          ? "Dili İngilizce olarak değiştir"
          : "Switch language to Turkish"
      }
      className="locale-switcher"
      data-compact={compact || undefined}
      href={href}
      hrefLang={targetLocale}
      lang={targetLocale}
    >
      {compact ? targetLocale.toUpperCase() : label}
    </Link>
  );
}
