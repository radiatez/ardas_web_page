import { notFound } from "next/navigation";

import { Container, Eyebrow, Section } from "@/components/public/layout-primitives";
import { publicShellCopy } from "@/content/public-shell";
import { isLocale, locales } from "@/i18n/config";

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

  const copy = publicShellCopy[rawLocale].home;

  return (
    <main className="shell-placeholder" id="main-content">
      <Section spacing="large">
        <Container>
          <div className="shell-placeholder__content motion-reveal">
            <Eyebrow>{copy.eyebrow}</Eyebrow>
            <h1 className="type-display">{copy.heading}</h1>
            <p className="type-lead">{copy.description}</p>
          </div>
        </Container>
      </Section>
    </main>
  );
}
