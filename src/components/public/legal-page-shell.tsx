import type { PublicPageDocument } from "@/content/public-pages";

import { Container, Eyebrow, Grid, Section } from "./layout-primitives";

type LegalPageShellProps = {
  page: PublicPageDocument;
};

export function LegalPageShell({ page }: LegalPageShellProps) {
  return (
    <main id="main-content">
      <Section className="legal-page" spacing="large">
        <Container>
          <Grid>
            <header className="legal-page__header motion-reveal">
              {page.content.hero.eyebrow ? (
                <Eyebrow>{page.content.hero.eyebrow}</Eyebrow>
              ) : null}
              <h1 className="type-h1">{page.content.hero.heading}</h1>
            </header>
            <div className="legal-page__content">
              {page.content.legalBlocks.map((block, index) => (
                <section className="legal-page__block" key={`${block.heading}-${index}`}>
                  <span className="signature-rule" aria-hidden="true" />
                  <h2 className="type-h3">{block.heading}</h2>
                  {block.body.map((paragraph) => (
                    <p className="type-body" key={paragraph}>{paragraph}</p>
                  ))}
                </section>
              ))}
            </div>
          </Grid>
        </Container>
      </Section>
    </main>
  );
}
