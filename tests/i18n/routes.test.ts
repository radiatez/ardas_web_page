import { describe, expect, it } from "vitest";

import {
  getLanguageSwitchTarget,
  getLocalizedPath,
  getRouteByPath,
  routeDefinitions,
  routeKeys,
} from "../../src/i18n/routes";

describe("localized route registry", () => {
  it("contains every approved stable route key", () => {
    expect(routeKeys).toEqual([
      "home",
      "corporate",
      "brands",
      "product-groups",
      "locations",
      "careers",
      "career-apply",
      "contact",
      "privacy",
      "cookies",
      "data-protection",
    ]);
    expect(Object.keys(routeDefinitions)).toEqual(routeKeys);
  });

  it.each([
    ["home", "tr", "/tr"],
    ["home", "en", "/en"],
    ["corporate", "tr", "/tr/kurumsal"],
    ["corporate", "en", "/en/corporate"],
    ["product-groups", "tr", "/tr/urun-gruplari"],
    ["product-groups", "en", "/en/product-groups"],
    ["career-apply", "tr", "/tr/kariyer/basvuru"],
    ["career-apply", "en", "/en/careers/apply"],
    ["data-protection", "tr", "/tr/kvkk"],
    ["data-protection", "en", "/en/data-protection"],
  ] as const)("maps %s/%s to %s", (routeKey, locale, expectedPath) => {
    expect(getLocalizedPath(routeKey, locale)).toBe(expectedPath);
    expect(getRouteByPath(expectedPath)).toEqual({ locale, routeKey });
  });

  it("falls back to the target homepage only when the equivalent is unavailable", () => {
    expect(getLanguageSwitchTarget("corporate", "en", true)).toBe(
      "/en/corporate",
    );
    expect(getLanguageSwitchTarget("corporate", "en", false)).toBe("/en");
  });

  it("does not resolve unapproved or unprefixed paths", () => {
    expect(getRouteByPath("/de")).toBeUndefined();
    expect(getRouteByPath("/corporate")).toBeUndefined();
  });
});
