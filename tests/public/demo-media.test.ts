import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  demoMediaManifest,
  getDevelopmentMediaMap,
} from "../../src/content/demo-media";
import { demoMediaRequestIsAllowed } from "../../src/content/development-content";
import { getDevelopmentPage } from "../../src/content/public-pages";

describe("Milestone 4.1 demo media contract", () => {
  it("keeps a complete replaceable local prototype set in the workspace", () => {
    expect(demoMediaManifest.length).toBeGreaterThanOrEqual(5);
    expect(new Set(demoMediaManifest.map((asset) => asset.id)).size)
      .toBe(demoMediaManifest.length);

    for (const asset of demoMediaManifest) {
      expect(asset.src.startsWith("/demo-media/")).toBe(true);
      expect(existsSync(join(process.cwd(), asset.src.slice(1)))).toBe(true);
      expect(asset.intendedUse.length).toBeGreaterThan(0);
      expect(asset.focalX).toBeGreaterThanOrEqual(0);
      expect(asset.focalX).toBeLessThanOrEqual(1);
      expect(asset.focalY).toBeGreaterThanOrEqual(0);
      expect(asset.focalY).toBeLessThanOrEqual(1);
    }
  });

  it("provides locale-aware alt text and explicit decorative semantics", () => {
    for (const asset of demoMediaManifest) {
      for (const locale of ["tr", "en"] as const) {
        if (asset.role === "meaningful") {
          expect(asset.locale[locale].altText.trim()).not.toBe("");
        } else {
          expect(asset.locale[locale].altText).toBe("");
        }
      }
    }
  });

  it("maps every development homepage placement to the MediaLocale shape", () => {
    for (const locale of ["tr", "en"] as const) {
      const page = getDevelopmentPage("home", locale);
      const mediaMap = getDevelopmentMediaMap(locale);
      const blocks = [page.content.hero, ...Object.values(page.content.sections)];

      for (const block of blocks.filter((candidate) => candidate.mediaId)) {
        const media = mediaMap[block.mediaId!];
        expect(media).toBeDefined();
        expect(media?.mediaLocale.locale).toBe(locale);
        if (block.decorativeMedia) {
          expect(media?.mediaLocale.altText).toBe("");
        } else {
          expect(media?.mediaLocale.altText?.trim()).not.toBe("");
        }
      }
    }
  });

  it("denies direct demo-media requests outside local/test environments", () => {
    expect(
      demoMediaRequestIsAllowed("/demo-media/warehouse-hero.png", {
        APP_ENV: "local",
      }),
    ).toBe(true);
    expect(
      demoMediaRequestIsAllowed("/demo-media/warehouse-hero.png", {
        APP_ENV: "test",
      }),
    ).toBe(true);
    expect(
      demoMediaRequestIsAllowed("/demo-media/warehouse-hero.png", {
        APP_ENV: "staging",
      }),
    ).toBe(false);
    expect(
      demoMediaRequestIsAllowed("/demo-media/warehouse-hero.png", {
        APP_ENV: "production",
      }),
    ).toBe(false);
    expect(
      demoMediaRequestIsAllowed("/tr", { APP_ENV: "production" }),
    ).toBe(true);
    expect(
      demoMediaRequestIsAllowed(
        "/_next/image",
        { APP_ENV: "production" },
        "/demo-media/warehouse-hero.png",
      ),
    ).toBe(false);
    expect(
      demoMediaRequestIsAllowed(
        "/_next/image",
        { APP_ENV: "production" },
        "/approved-media/warehouse.jpg",
      ),
    ).toBe(true);
  });
});
