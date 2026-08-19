import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  CorporateMedia,
  toFocalPercentage,
} from "../../src/components/public/corporate-media";

describe("localized corporate media", () => {
  it("requires MediaLocale alt text for meaningful imagery", () => {
    expect(() =>
      renderToStaticMarkup(
        <CorporateMedia
          height={720}
          mediaLocale={{ locale: "tr", altText: null }}
          src="/media/warehouse.jpg"
          width={1280}
        />,
      ),
    ).toThrowError("Meaningful media requires MediaLocale alt text for tr.");
  });

  it("uses empty alt and aria-hidden for decorative imagery", () => {
    const html = renderToStaticMarkup(
      <CorporateMedia
        decorative
        height={720}
        mediaLocale={{ locale: "en", altText: null }}
        src="/media/texture.jpg"
        width={1280}
      />,
    );

    expect(html).toContain('alt=""');
    expect(html).toContain('aria-hidden="true"');
  });

  it("normalizes database focal points to safe CSS percentages", () => {
    expect(toFocalPercentage(undefined)).toBe(50);
    expect(toFocalPercentage(-0.25)).toBe(0);
    expect(toFocalPercentage(0.42)).toBe(42);
    expect(toFocalPercentage(1.5)).toBe(100);
  });
});
