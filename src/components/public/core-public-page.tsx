import type { PublicPageBundle } from "@/public/content-repository";

import { CorporateMedia } from "./corporate-media";
import { EditorialCopy, EditorialMedia } from "./editorial-content";
import { Container, Grid, Section } from "./layout-primitives";
import { TbdState } from "./public-homepage";

export function CorePublicPage({ bundle }: { bundle: PublicPageBundle }) {
  switch (bundle.page.routeKey) {
    case "brands":
      return <BrandsPage bundle={bundle} />;
    case "product-groups":
      return <ProductGroupsPage bundle={bundle} />;
    case "locations":
      return <LocationsPage bundle={bundle} />;
    case "corporate":
      return <CorporatePage bundle={bundle} />;
    case "careers":
    case "contact":
      return <CallToActionPage bundle={bundle} />;
    default:
      return <EditorialPage bundle={bundle} />;
  }
}

function InteriorHero({ bundle }: { bundle: PublicPageBundle }) {
  const { page, blockMedia } = bundle;
  return (
    <section className="interior-hero">
      <Container>
        <Grid>
          <EditorialCopy
            block={page.content.hero}
            className="interior-hero__copy motion-reveal"
            headingClassName="type-h1"
            headingLevel="h1"
            locale={page.locale}
          />
          <EditorialMedia
            block={page.content.hero}
            className="interior-hero__media motion-reveal"
            locale={page.locale}
            media={
              page.content.hero.mediaId
                ? blockMedia[page.content.hero.mediaId]
                : undefined
            }
            preload
            sizes="(min-width: 64rem) 42vw, 100vw"
          />
        </Grid>
      </Container>
    </section>
  );
}

function CorporatePage({ bundle }: { bundle: PublicPageBundle }) {
  const sections = Object.entries(bundle.page.content.sections);
  return (
    <main id="main-content">
      <InteriorHero bundle={bundle} />
      <Section className="corporate-stat-strip" spacing="compact">
        <Container>
          <dl className="corporate-stat-strip__grid">
            <Stat value="30+" label={bundle.page.locale === "tr" ? "Yıllık deneyim" : "Years of experience"} />
            <Stat value="3" label={bundle.page.locale === "tr" ? "Şehir" : "Cities"} />
            <Stat value="Türkiye" label={bundle.page.locale === "tr" ? "Geneli dağıtım" : "Nationwide distribution"} />
          </dl>
        </Container>
      </Section>
      <Section className="interior-sections">
        <Container>
          <div className="interior-sections__list">
            {sections.map(([key, block], index) => (
              <article className="interior-editorial-row" key={key}>
                <span className="interior-editorial-row__number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <EditorialCopy block={block} locale={bundle.page.locale} />
              </article>
            ))}
          </div>
        </Container>
      </Section>
    </main>
  );
}

function BrandsPage({ bundle }: { bundle: PublicPageBundle }) {
  const { locale } = bundle.page;
  return (
    <main id="main-content">
      <InteriorHero bundle={bundle} />
      <Section className="directory-section">
        <Container>
          {bundle.brands.length > 0 ? (
            <div className="brand-directory" role="list">
              {bundle.brands.map((brand, index) => (
                <article className="brand-directory__item" key={brand.id} role="listitem">
                  <span className="directory-number" aria-hidden="true">
                    {String(index + 1).padStart(3, "0")}
                  </span>
                  {brand.media && brand.media.mediaLocale.altText ? (
                    <CorporateMedia
                      className="brand-directory__media"
                      height={brand.media.height}
                      mediaLocale={brand.media.mediaLocale}
                      sizes="(min-width: 64rem) 16rem, 40vw"
                      src={brand.media.src}
                      width={brand.media.width}
                    />
                  ) : null}
                  <div>
                    <h2 className="type-h3">{brand.name}</h2>
                    {brand.description ? <p className="type-body">{brand.description}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <TbdState locale={locale} subject={locale === "tr" ? "Onaylı marka listesi ve logo hakları" : "Approved brand directory and logo rights"} />
          )}
        </Container>
      </Section>
    </main>
  );
}

function ProductGroupsPage({ bundle }: { bundle: PublicPageBundle }) {
  const { locale } = bundle.page;
  return (
    <main id="main-content">
      <InteriorHero bundle={bundle} />
      <Section className="directory-section">
        <Container>
          {bundle.productGroups.length > 0 ? (
            <div className="product-directory">
              {bundle.productGroups.map((group, index) => (
                <article className="product-directory__item" key={group.id}>
                  <span className="directory-number" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="product-directory__media">
                    {group.media && group.media.mediaLocale.altText ? (
                      <CorporateMedia
                        focalX={group.media.focalX}
                        focalY={group.media.focalY}
                        height={group.media.height}
                        mediaLocale={group.media.mediaLocale}
                        sizes="(min-width: 64rem) 30vw, 100vw"
                        src={group.media.src}
                        width={group.media.width}
                      />
                    ) : (
                      <div className="product-directory__media-placeholder" aria-hidden="true" />
                    )}
                  </div>
                  <div className="product-directory__copy">
                    <h2 className="type-h3">{group.name}</h2>
                    {group.description ? <p className="type-body">{group.description}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <TbdState locale={locale} subject={locale === "tr" ? "Onaylı ürün grubu taksonomisi" : "Approved product group taxonomy"} />
          )}
        </Container>
      </Section>
    </main>
  );
}

function LocationsPage({ bundle }: { bundle: PublicPageBundle }) {
  const { locale } = bundle.page;
  return (
    <main id="main-content">
      <InteriorHero bundle={bundle} />
      <Section className="locations-directory">
        <Container>
          <ol>
            {bundle.locations.map((location, index) => (
              <li key={location.id}>
                <span className="locations-directory__number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="locations-directory__copy">
                  <h2 className="type-h2">{location.name}</h2>
                  {location.description ? <p className="type-body">{location.description}</p> : null}
                  {location.workingHours ? <p className="type-body">{location.workingHours}</p> : null}
                  {!location.description && !location.workingHours ? (
                    <p className="locations-directory__tbd">
                      {locale === "tr" ? "Onaylı adres ve iletişim bilgileri · TBD" : "Approved address and contact details · TBD"}
                    </p>
                  ) : null}
                </div>
                {location.media && location.media.mediaLocale.altText ? (
                  <CorporateMedia
                    className="locations-directory__media"
                    focalX={location.media.focalX}
                    focalY={location.media.focalY}
                    height={location.media.height}
                    mediaLocale={location.media.mediaLocale}
                    sizes="(min-width: 64rem) 32vw, 100vw"
                    src={location.media.src}
                    width={location.media.width}
                  />
                ) : null}
              </li>
            ))}
          </ol>
        </Container>
      </Section>
    </main>
  );
}

function CallToActionPage({ bundle }: { bundle: PublicPageBundle }) {
  const { page } = bundle;
  const isCareer = page.routeKey === "careers";
  return (
    <main id="main-content">
      <InteriorHero bundle={bundle} />
      <Section className="cta-status" spacing="large">
        <Container>
          <Grid>
            <div className="cta-status__number" aria-hidden="true">
              {isCareer ? "01" : "02"}
            </div>
            <div className="cta-status__content" role="status">
              <span className="signature-rule" aria-hidden="true" />
              <h2 className="type-h2">
                {page.locale === "tr"
                  ? isCareer
                    ? "Başvuru deneyimi Milestone 5’te açılacak."
                    : "İletişim formu Milestone 5’te açılacak."
                  : isCareer
                    ? "The application experience will open in Milestone 5."
                    : "The contact form will open in Milestone 5."}
              </h2>
              <p className="type-body">
                {page.locale === "tr"
                  ? "Onaylı içerik ve form yayını bekleniyor · TBD"
                  : "Approved content and form publication are pending · TBD"}
              </p>
            </div>
          </Grid>
        </Container>
      </Section>
    </main>
  );
}

function EditorialPage({ bundle }: { bundle: PublicPageBundle }) {
  return (
    <main id="main-content">
      <InteriorHero bundle={bundle} />
      <Section>
        <Container>
          {Object.entries(bundle.page.content.sections).map(([key, block]) => (
            <EditorialCopy block={block} key={key} locale={bundle.page.locale} />
          ))}
        </Container>
      </Section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dd className={value === "Türkiye" ? "type-h3" : "type-stat"}>{value}</dd>
      <dt>{label}</dt>
    </div>
  );
}
