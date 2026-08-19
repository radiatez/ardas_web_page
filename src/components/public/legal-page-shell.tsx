import { publicShellCopy } from "@/content/public-shell";
import type { Locale } from "@/i18n/config";

import { Container, Eyebrow, Grid, Section } from "./layout-primitives";

export type LegalRouteKey = "privacy" | "cookies" | "data-protection";

type LegalPageShellProps = {
  locale: Locale;
  routeKey: LegalRouteKey;
};

export function LegalPageShell({ locale, routeKey }: LegalPageShellProps) {
  const copy = publicShellCopy[locale].legal;
  const page = copy[routeKey];

  return (
    <main id="main-content">
      <Section className="legal-page" spacing="large">
        <Container>
          <Grid>
            <header className="legal-page__header motion-reveal">
              <Eyebrow>{page.eyebrow}</Eyebrow>
              <h1 className="type-h1">{page.title}</h1>
            </header>
            <div className="legal-page__content" role="status">
              <span className="signature-rule" aria-hidden="true" />
              <h2 className="type-h3">{copy.pendingHeading}</h2>
              <p className="type-body">{copy.pendingDescription}</p>
            </div>
          </Grid>
        </Container>
      </Section>
    </main>
  );
}
