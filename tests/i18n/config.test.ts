import { describe, expect, it } from "vitest";

import {
  defaultLocale,
  getAlternateLocale,
  isLocale,
  locales,
} from "../../src/i18n/config";

describe("locale configuration", () => {
  it("keeps Turkish as the deterministic default", () => {
    expect(defaultLocale).toBe("tr");
  });

  it("contains exactly the approved public locales", () => {
    expect(locales).toEqual(["tr", "en"]);
  });

  it("rejects unsupported locale identifiers", () => {
    expect(isLocale("tr")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
  });

  it("maps the language switch to the other supported locale", () => {
    expect(getAlternateLocale("tr")).toBe("en");
    expect(getAlternateLocale("en")).toBe("tr");
  });
});
