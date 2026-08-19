import { publicShellCopy } from "@/content/public-shell";
import type { Locale } from "@/i18n/config";

import { Container, Eyebrow, Grid, Section } from "./layout-primitives";

export function DesignSystemShowcase({ locale }: { locale: Locale }) {
  const copy = publicShellCopy[locale];

  return (
    <main id="main-content">
      <Section className="showcase-intro" spacing="large">
        <Container>
          <Eyebrow>Development preview · noindex</Eyebrow>
          <h1 className="type-display">Ardaş design system</h1>
          <p className="type-lead">
            Token, typography, grid, surface and interaction primitives.
          </p>
        </Container>
      </Section>

      <Section className="showcase-section">
        <Container>
          <Eyebrow>Typography</Eyebrow>
          <div className="showcase-type-stack">
            <p className="type-display">Display / Global scale</p>
            <h2 className="type-h1">Heading level one</h2>
            <h3 className="type-h2">Heading level two</h3>
            <h4 className="type-h3">Heading level three</h4>
            <p className="type-lead">
              Lead copy creates a calm, legible bridge between headline and detail.
            </p>
            <p className="type-body">
              Body copy remains readable across Turkish and English with a restrained
              line length and predictable vertical rhythm.
            </p>
            <p className="type-stat">50.000+</p>
          </div>
        </Container>
      </Section>

      <Section className="showcase-section" spacing="compact">
        <Container>
          <Eyebrow>Color & surfaces</Eyebrow>
          <Grid className="showcase-swatches">
            <div className="showcase-swatch" data-surface="primary">Primary</div>
            <div className="showcase-swatch" data-surface="subtle">Subtle</div>
            <div className="showcase-swatch" data-surface="quiet">Quiet</div>
            <div className="showcase-swatch" data-surface="accent">Accent</div>
            <div className="showcase-swatch" data-surface="inverse">Inverse</div>
          </Grid>
        </Container>
      </Section>

      <Section className="showcase-section">
        <Container>
          <Eyebrow>Grid & actions</Eyebrow>
          <Grid className="showcase-grid">
            {Array.from({ length: 12 }, (_, index) => (
              <span key={index}>{index + 1}</span>
            ))}
          </Grid>
          <div className="showcase-actions">
            <button className="button-primary" type="button">
              {copy.dealerPortalLabel}
            </button>
            <a className="action-link" href="#typography">
              Text action →
            </a>
          </div>
        </Container>
      </Section>
    </main>
  );
}
