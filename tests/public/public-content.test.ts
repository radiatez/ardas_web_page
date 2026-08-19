import { describe, expect, it } from "vitest";

import {
  getDevelopmentPage,
  parsePublicPageContent,
  publicPageRouteKeys,
} from "../../src/content/public-pages";
import {
  developmentContentIsEnabled,
  resolvePublicMediaUrl,
} from "../../src/public/content-repository";
import { buildPublicPageMetadata } from "../../src/public/metadata";

describe("Milestone 4 public content contract", () => {
  it("provides explicit bilingual development documents for every public route", () => {
    for (const routeKey of publicPageRouteKeys) {
      for (const locale of ["tr", "en"] as const) {
        const page = getDevelopmentPage(routeKey, locale);
        expect(page.locale).toBe(locale);
        expect(page.source).toBe("placeholder");
        expect(page.availableLocales).toEqual(["tr", "en"]);
        expect(page.content.schemaVersion).toBe(1);
      }
    }
  });

  it("keeps the homepage narrative in its approved conceptual order", () => {
    const sections = Object.keys(getDevelopmentPage("home", "en").content.sections);
    expect(sections).toEqual([
      "capability",
      "brands",
      "products",
      "operations",
      "trust",
      "careers",
      "contact",
    ]);
  });

  it("uses only approved scale facts and leaves unapproved business data TBD", () => {
    const serialized = JSON.stringify(getDevelopmentPage("home", "tr"));
    for (const fact of ["30+", "150+", "50.000+", "İstanbul", "Ankara", "Diyarbakır"]) {
      expect(serialized).toContain(fact);
    }
    expect(serialized).toContain("TBD");
    expect(serialized).not.toMatch(/ISO 9001|Bosch|Mercedes|telefon:\s*\+90/i);
  });

  it("sanitizes versioned CMS blocks and accepts only known route actions", () => {
    const parsed = parsePublicPageContent(
      {
        hero: {
          heading: " Safe heading ",
          body: ["Body"],
          action: { label: "Bad", routeKey: "external-url" },
          mediaId: "not-a-uuid",
        },
        sections: {
          valid: {
            heading: "Valid",
            action: { label: "Contact", routeKey: "contact" },
          },
          "<script>": { heading: "Rejected" },
        },
      },
      "Fallback",
    );

    expect(parsed.hero.heading).toBe("Safe heading");
    expect(parsed.hero.action).toBeUndefined();
    expect(parsed.hero.mediaId).toBeUndefined();
    expect(Object.keys(parsed.sections)).toEqual(["valid"]);
    expect(parsed.sections.valid?.action?.routeKey).toBe("contact");
  });

  it("enables placeholders only in local/test contexts", () => {
    expect(developmentContentIsEnabled({ APP_ENV: "local" })).toBe(true);
    expect(developmentContentIsEnabled({ APP_ENV: "test" })).toBe(true);
    expect(developmentContentIsEnabled({ APP_ENV: "staging" })).toBe(false);
    expect(developmentContentIsEnabled({ APP_ENV: "production" })).toBe(false);
  });

  it("constructs public media URLs only from an HTTPS base", () => {
    expect(resolvePublicMediaUrl("corporate/hero image.webp", "https://media.example.com/public"))
      .toBe("https://media.example.com/public/corporate/hero%20image.webp");
    expect(resolvePublicMediaUrl("asset.webp", "http://media.example.com")).toBeUndefined();
    expect(resolvePublicMediaUrl("/absolute.webp", "https://media.example.com")).toBeUndefined();
    expect(resolvePublicMediaUrl("../private/asset.webp", "https://media.example.com/public")).toBeUndefined();
  });

  it("makes placeholder SEO non-indexable while retaining localized canonicals", () => {
    const metadata = buildPublicPageMetadata(getDevelopmentPage("corporate", "tr"));
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
    expect(metadata.alternates).toMatchObject({
      canonical: "/tr/kurumsal",
      languages: {
        tr: "/tr/kurumsal",
        en: "/en/corporate",
        "x-default": "/tr/kurumsal",
      },
    });
  });

  it("indexes CMS content without advertising an unpublished locale", () => {
    const page = {
      ...getDevelopmentPage("corporate", "tr"),
      source: "cms" as const,
      availableLocales: ["tr"] as const,
    };
    const metadata = buildPublicPageMetadata(page);
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
    expect(metadata.alternates).toMatchObject({
      languages: { tr: "/tr/kurumsal", "x-default": "/tr/kurumsal" },
    });
    expect(metadata.alternates?.languages).not.toHaveProperty("en");
  });
});
