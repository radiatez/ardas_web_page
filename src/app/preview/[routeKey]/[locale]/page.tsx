import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadPagePreview } from "@/admin/cms";
import { requireAdminPagePermission } from "@/admin/request-access";
import { CorePublicPage } from "@/components/public/core-public-page";
import { LegalPageShell } from "@/components/public/legal-page-shell";
import { PublicHomepage } from "@/components/public/public-homepage";
import { publicPageRouteKeys, type PublicPageRouteKey } from "@/content/public-pages";
import { getRuntimeDatabase } from "@/db/runtime";
import { isLocale } from "@/i18n/config";
import { loadPublishedPageBundle, type PublicPageBundle } from "@/public/content-repository";

export const metadata: Metadata = { title: "Güvenli içerik önizleme", robots: { index: false, follow: false, noarchive: true, noimageindex: true } };

export default async function AdminPreviewPage({ params }: { params: Promise<{ routeKey: string; locale: string }> }) {
  const { routeKey: rawRouteKey, locale: rawLocale } = await params;
  if (!publicPageRouteKeys.includes(rawRouteKey as PublicPageRouteKey) || !isLocale(rawLocale)) notFound();
  const principal = await requireAdminPagePermission("Pages:view", { returnTo: `/preview/${rawRouteKey}/${rawLocale}` });
  const { db } = getRuntimeDatabase(); const routeKey = rawRouteKey as PublicPageRouteKey;
  const page = await loadPagePreview(db, principal, routeKey, rawLocale);
  const published = await loadPublishedPageBundle(db, routeKey, rawLocale).catch(() => undefined);
  const bundle: PublicPageBundle = published ? { ...published, page } : { page, blockMedia: {}, brands: [], productGroups: [], locations: [] };
  const legal = routeKey === "privacy" || routeKey === "cookies" || routeKey === "data-protection";
  return routeKey === "home" ? <PublicHomepage bundle={bundle} /> : legal ? <LegalPageShell controllerDetails={bundle.legalController} page={page} /> : <CorePublicPage bundle={bundle} />;
}
