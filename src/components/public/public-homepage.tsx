import type { EditorialBlock } from "@/content/public-pages";
import type { Locale } from "@/i18n/config";
import type { PublicPageBundle } from "@/public/content-repository";

import {
  EditorialActionLink,
  EditorialCopy,
  EditorialMedia,
} from "./editorial-content";
import { Container, Eyebrow, Grid, Section } from "./layout-primitives";

type HomepageSectionKey =
  | "capability"
  | "brands"
  | "products"
  | "operations"
  | "trust"
  | "careers"
  | "contact";

/* The call order below is the approved Impact → Contact narrative. */
const homepageSectionKeys = [
  "capability",
  "brands",
  "products",
  "operations",
  "trust",
  "careers",
  "contact",
] as const;

function getSection(
  sections: Readonly<Record<string, EditorialBlock>>,
  key: HomepageSectionKey,
): EditorialBlock | undefined {
  return sections[key];
}

export const homepageNarrative = homepageSectionKeys;

export function PublicHomepage({ bundle }: { bundle: PublicPageBundle }) {
  const { page, blockMedia, brands, productGroups, locations } = bundle;
  const { locale, content } = page;
  const capability = getSection(content.sections, "capability");
  const brandSection = getSection(content.sections, "brands");
  const productSection = getSection(content.sections, "products");
  const operations = getSection(content.sections, "operations");
  const trust = getSection(content.sections, "trust");
  const careers = getSection(content.sections, "careers");
  const contact = getSection(content.sections, "contact");
  const featuredBrands = brands.filter((brand) => brand.featured).slice(0, 8);

  return (
    <main id="main-content">
      <section className="home-impact">
        <Container>
          <div className="home-impact__frame">
            <EditorialMedia
              block={content.hero}
              className="home-impact__media motion-reveal"
              locale={locale}
              media={content.hero.mediaId ? blockMedia[content.hero.mediaId] : undefined}
              preload
              sizes="(min-width: 85rem) 85rem, 100vw"
            />
            <EditorialCopy
              block={content.hero}
              className="home-impact__copy motion-reveal"
              headingClassName="type-display"
              headingLevel="h1"
              locale={locale}
            />
          </div>
        </Container>
      </section>

      <Section className="home-scale" spacing="compact">
        <Container>
          <Eyebrow>{locale === "tr" ? "Ölçek" : "Scale"}</Eyebrow>
          <dl className="home-scale__grid">
            <Stat label={locale === "tr" ? "Şehir" : "Cities"} value="3" />
            <Stat label={locale === "tr" ? "Yıllık deneyim" : "Years of experience"} value="30+" />
            <Stat label={locale === "tr" ? "Marka" : "Brands"} value="150+" />
            <Stat label={locale === "tr" ? "Ürün" : "Products"} value={locale === "tr" ? "50.000+" : "50,000+"} />
          </dl>
        </Container>
      </Section>

      {capability ? (
        <EditorialSplit
          block={capability}
          locale={locale}
          media={capability.mediaId ? blockMedia[capability.mediaId] : undefined}
          theme="quiet"
        />
      ) : null}

      {brandSection ? (
        <Section className="home-portfolio">
          <Container>
            <Grid>
              <EditorialCopy
                block={brandSection}
                className="home-portfolio__intro"
                locale={locale}
              />
              <EditorialMedia
                block={brandSection}
                className="home-portfolio__media"
                locale={locale}
                media={brandSection.mediaId ? blockMedia[brandSection.mediaId] : undefined}
                sizes="(min-width: 64rem) 58vw, 100vw"
              />
              <div className="home-portfolio__list" data-empty={featuredBrands.length === 0 || undefined}>
                {featuredBrands.length > 0 ? (
                  featuredBrands.map((brand) => (
                    <article className="brand-index-item" key={brand.id}>
                      <span className="brand-index-item__name">{brand.name}</span>
                      {brand.description ? <p>{brand.description}</p> : null}
                    </article>
                  ))
                ) : (
                  <TbdState locale={locale} subject={locale === "tr" ? "Marka seçkisi hazırlanıyor" : "Brand selection in preparation"} />
                )}
              </div>
            </Grid>
          </Container>
        </Section>
      ) : null}

      {productSection ? (
        <Section className="home-products">
          <Container>
            <Grid className="home-products__lead">
              <EditorialCopy block={productSection} className="home-products__intro" locale={locale} />
              <EditorialMedia
                block={productSection}
                className="home-products__media"
                locale={locale}
                media={productSection.mediaId ? blockMedia[productSection.mediaId] : undefined}
                sizes="(min-width: 64rem) 50vw, 100vw"
              />
            </Grid>
            <div className="home-products__grid">
              {productGroups.length > 0 ? (
                productGroups.slice(0, 6).map((group, index) => (
                  <article className="product-index-item" key={group.id}>
                    <span className="product-index-item__number" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="type-h3">{group.name}</h3>
                    {group.description ? <p className="type-body">{group.description}</p> : null}
                  </article>
                ))
              ) : (
                <TbdState locale={locale} subject={locale === "tr" ? "Ürün grubu seçkisi hazırlanıyor" : "Product-group selection in preparation"} />
              )}
            </div>
          </Container>
        </Section>
      ) : null}

      {operations ? (
        <Section className="home-operations">
          <Container>
            <Grid>
              <EditorialCopy block={operations} className="home-operations__intro" locale={locale} />
              <div className="home-operations__visual">
                <EditorialMedia
                  block={operations}
                  className="home-operations__media"
                  locale={locale}
                  media={operations.mediaId ? blockMedia[operations.mediaId] : undefined}
                  sizes="(min-width: 64rem) 58vw, 100vw"
                />
                <ol className="location-index">
                  {locations.map((location, index) => (
                    <li key={location.id}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{location.name}</strong>
                    </li>
                  ))}
                </ol>
              </div>
            </Grid>
          </Container>
        </Section>
      ) : null}

      {trust ? (
        <Section className="home-trust" spacing="large">
          <Container>
            <Grid>
              <EditorialCopy block={trust} className="home-trust__copy" locale={locale} />
              <div className="home-trust__mark" aria-hidden="true">30+</div>
            </Grid>
          </Container>
        </Section>
      ) : null}

      {careers ? (
        <Section className="home-careers">
          <Container>
            <div className="home-careers__panel">
              <EditorialMedia
                block={careers}
                className="home-careers__media"
                locale={locale}
                media={careers.mediaId ? blockMedia[careers.mediaId] : undefined}
                sizes="(min-width: 64rem) 58vw, 100vw"
              />
              <EditorialCopy block={careers} className="home-careers__copy" locale={locale} />
            </div>
          </Container>
        </Section>
      ) : null}

      {contact ? (
        <Section className="home-contact" spacing="large">
          <Container>
            <Grid>
              <EditorialCopy block={contact} className="home-contact__copy" locale={locale} showAction={false} />
              {contact.action ? (
                <EditorialActionLink
                  action={contact.action}
                  className="home-contact__action"
                  locale={locale}
                />
              ) : null}
            </Grid>
          </Container>
        </Section>
      ) : null}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="home-scale__stat">
      <dd className="type-stat">{value}</dd>
      <dt>{label}</dt>
    </div>
  );
}

function EditorialSplit({
  block,
  locale,
  media,
  theme,
}: {
  block: EditorialBlock;
  locale: Locale;
  media?: PublicPageBundle["blockMedia"][string];
  theme: "quiet";
}) {
  return (
    <Section className={`editorial-split editorial-split--${theme}`}>
      <Container>
        <Grid>
          <EditorialMedia
            block={block}
            className="editorial-split__media"
            locale={locale}
            media={media}
            sizes="(min-width: 64rem) 50vw, 100vw"
          />
          <EditorialCopy block={block} className="editorial-split__copy" locale={locale} />
        </Grid>
      </Container>
    </Section>
  );
}

export function TbdState({ locale, subject }: { locale: Locale; subject: string }) {
  return (
    <div className="public-tbd" role="status">
      <span className="signature-rule" aria-hidden="true" />
      <strong>{subject}</strong>
      <span>{locale === "tr" ? "Onaylı içerik seçkisi bu yapıya kademeli olarak eklenecek." : "The approved content selection will be added to this structure progressively."}</span>
    </div>
  );
}
