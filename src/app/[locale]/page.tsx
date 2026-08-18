import Link from "next/link";
import { notFound } from "next/navigation";

import { scaffoldCopy } from "@/content/scaffold";
import {
  getAlternateLocale,
  isLocale,
  locales,
  type Locale,
} from "@/i18n/config";

type LocaleHomePageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleHomePage({ params }: LocaleHomePageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const copy = scaffoldCopy[locale];
  const alternateLocale = getAlternateLocale(locale);

  return (
    <main className="scaffold-shell">
      <header className="scaffold-header">
        <span className="wordmark" aria-label="Ardaş Yedek Parça">
          ARDAŞ
        </span>
        <Link className="language-link" href={`/${alternateLocale}`}>
          {copy.languageLabel}
        </Link>
      </header>

      <section className="scaffold-hero" aria-labelledby="scaffold-heading">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 id="scaffold-heading">{copy.heading}</h1>
        <p className="lead">{copy.description}</p>
      </section>

      <dl className="metric-grid" aria-label={locale === "tr" ? "Şirket ölçeği" : "Company scale"}>
        {copy.metrics.map((metric) => (
          <div className="metric" key={metric.label}>
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
