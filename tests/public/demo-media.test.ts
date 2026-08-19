import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  demoMediaManifest,
  getTemporaryMediaMap,
} from "../../src/content/demo-media";
import { getDevelopmentPage } from "../../src/content/public-pages";
import { GET as getDemoMedia } from "../../src/app/demo-media/[asset]/route";

describe("temporary public media contract", () => {
  it("keeps a complete replaceable production-safe set in the workspace", () => {
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
      expect(asset.temporaryMedia).toBe(true);
      expect(asset.requiresReplacement).toBe(true);
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

  it("maps every homepage placement to the MediaLocale shape", () => {
    for (const locale of ["tr", "en"] as const) {
      const page = getDevelopmentPage("home", locale);
      const mediaMap = getTemporaryMediaMap(locale);
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

  it("serves only allowlisted temporary assets with explicit replacement metadata", async () => {
    const response = await getDemoMedia(new Request("https://ardas.example/demo-media/warehouse-hero.png"), {
      params: Promise.resolve({ asset: "warehouse-hero.png" }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("x-ardas-media-status")).toBe("temporary-requires-replacement");
    expect(response.headers.get("cache-control")).not.toContain("immutable");

    const denied = await getDemoMedia(new Request("https://ardas.example/demo-media/secret.png"), {
      params: Promise.resolve({ asset: "secret.png" }),
    });
    expect(denied.status).toBe(404);
  });
});
