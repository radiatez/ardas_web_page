import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { isLocale, locales } from "@/i18n/config";
import { getPublicDealerPortalResolution } from "@/public/dealer-portal";

import "@/styles/tokens.css";
import "@/styles/global.css";

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Pick<LocaleLayoutProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  const isEnglish = locale === "en";

  return {
    title: {
      default: "ARDAŞ",
      template: "%s · ARDAŞ",
    },
    description: isEnglish
      ? "Ardaş Yedek Parça corporate website."
      : "Ardaş Yedek Parça kurumsal web sitesi.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dealerPortal = await getPublicDealerPortalResolution();

  return (
    <html lang={locale}>
      <body>
        <a className="skip-link" href="#main-content">
          {locale === "tr" ? "Ana içeriğe geç" : "Skip to main content"}
        </a>
        <PublicHeader dealerPortal={dealerPortal} locale={locale} />
        {children}
        <PublicFooter dealerPortal={dealerPortal} locale={locale} />
      </body>
    </html>
  );
}
