import { describe, expect, it } from "vitest";

import { getLocaleSwitchHref } from "../../src/components/public/locale-switcher";

describe("public locale switcher", () => {
  it.each([
    ["/tr", "tr", "/en"],
    ["/tr/kurumsal", "tr", "/en/corporate"],
    ["/en/product-groups", "en", "/tr/urun-gruplari"],
    ["/tr/cerez-politikasi/", "tr", "/en/cookie-policy"],
  ] as const)("switches %s to its localized equivalent", (path, locale, expected) => {
    expect(getLocaleSwitchHref(path, locale).href).toBe(expected);
  });

  it("falls back to the target homepage for an unknown or unavailable route", () => {
    expect(getLocaleSwitchHref("/tr/henüz-yok", "tr")).toMatchObject({
      href: "/en",
      routeKey: "home",
      targetLocale: "en",
    });
  });
});
