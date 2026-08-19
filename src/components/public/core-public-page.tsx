import { randomUUID } from "node:crypto";

import Link from "next/link";

import { resolveSubmissionRuntimeConfiguration } from "@/forms/configuration";
import { loadCareerFormOptions } from "@/forms/options";
import { getRuntimeDatabase } from "@/db/runtime";
import { getLocalizedPath } from "@/i18n/routes";
import type { PublicPageBundle } from "@/public/content-repository";

import { CorporateMedia } from "./corporate-media";
import { EditorialCopy, EditorialMedia } from "./editorial-content";
import { Container, Grid, Section } from "./layout-primitives";
import { CareerApplicationForm, ContactForm } from "./public-forms";
import { TbdState } from "./public-homepage";

export async function CorePublicPage({ bundle }: { bundle: PublicPageBundle }) {
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
      return <CareerLandingPage bundle={bundle} />;
    case "career-apply":
      return <CareerApplicationPage bundle={bundle} />;
    case "contact":
      return <ContactPage bundle={bundle} />;
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
                {block.mediaId ? (
                  <EditorialMedia
                    block={block}
                    className="interior-editorial-row__media"
                    locale={bundle.page.locale}
                    media={bundle.blockMedia[block.mediaId]}
                    sizes="(min-width: 64rem) 40vw, 100vw"
                  />
                ) : null}
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
            <TbdState locale={locale} subject={locale === "tr" ? "Ürün grubu seçkisi hazırlanıyor" : "Product-group selection in preparation"} />
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
                      {locale === "tr" ? "Adres ve iletişim bilgileri doğrulama süreci tamamlandığında burada yer alacak." : "Address and contact details will appear here when verification is complete."}
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

function CareerLandingPage({ bundle }: { bundle: PublicPageBundle }) {
  const { page } = bundle;
  return (
    <main id="main-content">
      <InteriorHero bundle={bundle} />
      <Section className="cta-status" spacing="large">
        <Container>
          <Grid>
            <div className="cta-status__number" aria-hidden="true">
              01
            </div>
            <div className="cta-status__content">
              <span className="signature-rule" aria-hidden="true" />
              <h2 className="type-h2">
                {page.locale === "tr"
                  ? "Genel başvurunuzu güvenli form üzerinden iletin."
                  : "Submit your general application through the secure form."}
              </h2>
              <p className="type-body">
                {page.locale === "tr"
                  ? "Başvurular yalnız yetkili İK erişimine açık olan veri ve dosya güvenliği sınırları içinde işlenir."
                  : "Applications are processed within data and file-security boundaries accessible only to authorized HR staff."}
              </p>
              <Link className="action-link" href={getLocalizedPath("career-apply", page.locale)}>
                {page.locale === "tr" ? "Genel başvuru formu" : "General application form"}
              </Link>
            </div>
          </Grid>
        </Container>
      </Section>
    </main>
  );
}

async function ContactPage({ bundle }: { bundle: PublicPageBundle }) {
  const { locale } = bundle.page;
  let configuration;
  try {
    const { db } = getRuntimeDatabase();
    configuration = await resolveSubmissionRuntimeConfiguration(db, "contact", locale);
  } catch {
    configuration = undefined;
  }

  return (
    <main id="main-content">
      <InteriorHero bundle={bundle} />
      <Section className="public-form-section">
        <Container>
          <Grid className="public-form-section__layout">
            <FormIntroduction
              eyebrow={locale === "tr" ? "İletişim formu" : "Contact form"}
              heading={locale === "tr" ? "Mesajınızı ilgili ekibe iletin." : "Send your message to the right team."}
              text={locale === "tr" ? "Zorunlu alanları doldurun. Kişisel bilgileriniz yalnız iletişim talebinin değerlendirilmesi amacıyla işlenir." : "Complete the required fields. Your personal data is processed only to evaluate your contact request."}
            />
            <div className="public-form-section__form">
              {configuration ? (
                <ContactForm
                  configuration={configuration}
                  noticeShownAt={new Date().toISOString()}
                  submissionId={randomUUID()}
                />
              ) : (
                <PublicFormUnavailable locale={locale} />
              )}
            </div>
          </Grid>
        </Container>
      </Section>
    </main>
  );
}

async function CareerApplicationPage({ bundle }: { bundle: PublicPageBundle }) {
  const { locale } = bundle.page;
  let configuration;
  let options;
  try {
    const { db } = getRuntimeDatabase();
    [configuration, options] = await Promise.all([
      resolveSubmissionRuntimeConfiguration(db, "career", locale),
      loadCareerFormOptions(db, locale),
    ]);
  } catch {
    configuration = undefined;
    options = undefined;
  }
  const ready =
    configuration &&
    options &&
    options.departments.length > 0 &&
    options.locations.length === 3
      ? { configuration, options }
      : undefined;

  return (
    <main id="main-content">
      <InteriorHero bundle={bundle} />
      <Section className="public-form-section public-form-section--career">
        <Container>
          <Grid className="public-form-section__layout">
            <FormIntroduction
              eyebrow={locale === "tr" ? "Genel başvuru" : "General application"}
              heading={locale === "tr" ? "Deneyiminizi bizimle paylaşın." : "Share your experience with us."}
              text={locale === "tr" ? "Başvuru formu ve CV yalnız yetkili İK süreçleri için kullanılır. CV dosyanız temiz güvenlik sonucu alınana kadar erişime kapalı kalır." : "The application form and CV are used only for authorized HR processes. Your CV remains inaccessible until a clean security result is received."}
            />
            <div className="public-form-section__form">
              {ready ? (
                <CareerApplicationForm
                  configuration={ready.configuration}
                  noticeShownAt={new Date().toISOString()}
                  options={ready.options}
                  submissionId={randomUUID()}
                />
              ) : (
                <PublicFormUnavailable locale={locale} />
              )}
            </div>
          </Grid>
        </Container>
      </Section>
    </main>
  );
}

function FormIntroduction({
  eyebrow,
  heading,
  text,
}: {
  eyebrow: string;
  heading: string;
  text: string;
}) {
  return (
    <div className="public-form-section__intro">
      <p className="type-eyebrow">{eyebrow}</p>
      <h2 className="type-h2">{heading}</h2>
      <p className="type-body">{text}</p>
    </div>
  );
}

function PublicFormUnavailable({ locale }: { locale: "tr" | "en" }) {
  return (
    <div className="public-form-unavailable" role="status">
      <span className="signature-rule" aria-hidden="true" />
      <h2 className="type-h3">
        {locale === "tr" ? "Form geçici olarak kullanılamıyor." : "The form is temporarily unavailable."}
      </h2>
      <p className="type-body">
        {locale === "tr"
          ? "Gerekli gizlilik, saklama veya sağlayıcı yapılandırması tamamlanmadan veri kabul edilmeyecektir."
          : "No data will be accepted until the required privacy, retention, and provider configuration is complete."}
      </p>
    </div>
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
