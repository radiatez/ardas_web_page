import { describe, expect, it } from "vitest";

import {
  getPublishedLocaleVariant,
  isPubliclyAvailable,
} from "../../src/content/publication";

const now = new Date("2026-08-18T12:00:00.000Z");

describe("locale-aware public availability", () => {
  it("returns only the requested published locale variant", () => {
    const variants = [
      {
        locale: "tr" as const,
        publishStatus: "published" as const,
        publishedAt: new Date("2026-08-17T12:00:00.000Z"),
        scheduledArchiveAt: null,
        title: "Türkçe",
      },
      {
        locale: "en" as const,
        publishStatus: "draft" as const,
        publishedAt: null,
        scheduledArchiveAt: null,
        title: "English",
      },
    ];

    expect(getPublishedLocaleVariant(variants, "tr", now)?.title).toBe(
      "Türkçe",
    );
    expect(getPublishedLocaleVariant(variants, "en", now)).toBeUndefined();
  });

  it("does not expose future or archived variants", () => {
    expect(
      isPubliclyAvailable(
        {
          locale: "en",
          publishStatus: "published",
          publishedAt: new Date("2026-08-19T12:00:00.000Z"),
          scheduledArchiveAt: null,
        },
        now,
      ),
    ).toBe(false);

    expect(
      isPubliclyAvailable(
        {
          locale: "en",
          publishStatus: "published",
          publishedAt: new Date("2026-08-17T12:00:00.000Z"),
          scheduledArchiveAt: new Date("2026-08-18T11:59:59.000Z"),
        },
        now,
      ),
    ).toBe(false);
  });
});
