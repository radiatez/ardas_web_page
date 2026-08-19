import { notFound } from "next/navigation";

import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { isLocale } from "@/i18n/config";
import { getPublicDealerPortalResolution } from "@/public/dealer-portal";
import "@/styles/tokens.css";
import "@/styles/global.css";

export default async function PreviewLayout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dealerPortal = await getPublicDealerPortalResolution();
  return <html lang={locale}><body><a className="skip-link" href="#main-content">{locale === "tr" ? "Ana içeriğe geç" : "Skip to main content"}</a>
    <div className="preview-security-banner">Yetkili taslak önizleme · noindex · {locale}</div>
    <PublicHeader dealerPortal={dealerPortal} locale={locale} />{children}<PublicFooter dealerPortal={dealerPortal} locale={locale} />
  </body></html>;
}
