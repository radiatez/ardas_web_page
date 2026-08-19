import type { PublicPageDocument } from "@/content/public-pages";
import type { LegalControllerDetails } from "@/public/legal-controller";

import { Container, Eyebrow, Grid, Section } from "./layout-primitives";

type LegalPageShellProps = {
  page: PublicPageDocument;
  controllerDetails?: LegalControllerDetails;
};

export function LegalPageShell({ controllerDetails, page }: LegalPageShellProps) {
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
                  {page.routeKey === "data-protection" && index === 0 && controllerDetails ? (
                    <dl className="legal-page__controller">
                      {controllerDetails.identity ? <div>
                        <dt>{page.locale === "tr" ? "Veri sorumlusu kimliği" : "Data controller identity"}</dt>
                        <dd>{controllerDetails.identity}</dd>
                      </div> : null}
                      {controllerDetails.contactChannels.map((channel) => <div key={channel}>
                        <dt>{page.locale === "tr" ? "İletişim / başvuru kanalı" : "Contact / application channel"}</dt>
                        <dd>{channel}</dd>
                      </div>)}
                    </dl>
                  ) : null}
                </section>
              ))}
            </div>
          </Grid>
        </Container>
      </Section>
    </main>
  );
}
