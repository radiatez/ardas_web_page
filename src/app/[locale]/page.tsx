import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicHomepage } from "@/components/public/public-homepage";
import { isLocale, locales } from "@/i18n/config";
import { getCachedPublicPageBundle } from "@/public/content-repository";
import { buildPublicPageMetadata } from "@/public/metadata";

type LocaleHomePageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleHomePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const bundle = await getCachedPublicPageBundle("home", locale);
  return bundle ? buildPublicPageMetadata(bundle.page) : {};
}

export default async function LocaleHomePage({ params }: LocaleHomePageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const bundle = await getCachedPublicPageBundle("home", rawLocale);
  if (!bundle) notFound();

  return <PublicHomepage bundle={bundle} />;
}
