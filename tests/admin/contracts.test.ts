import { describe, expect, it } from "vitest";

import { validatePageDraftInput, validateSlugRedirect } from "../../src/admin/cms";
import { validatePublicMediaUpload } from "../../src/admin/public-media";

function png(width = 1200, height = 800) {
  const bytes = new Uint8Array(24);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10], 0);
  bytes[16] = (width >>> 24) & 255; bytes[17] = (width >>> 16) & 255;
  bytes[18] = (width >>> 8) & 255; bytes[19] = width & 255;
  bytes[20] = (height >>> 24) & 255; bytes[21] = (height >>> 16) & 255;
  bytes[22] = (height >>> 8) & 255; bytes[23] = height & 255;
  return bytes;
}

describe("Milestone 6 CMS contracts", () => {
  it("normalizes the versioned public block contract and drops arbitrary keys", () => {
    const result = validatePageDraftInput({
      routeKey: "corporate",
      locale: "tr",
      title: "Kurumsal",
      content: {
        schemaVersion: 999,
        hero: { heading: "Kurumsal yapı", body: ["Açıklama"], script: "alert(1)" },
        sections: { overview: { heading: "Genel bakış", body: [] }, "BAD KEY": { heading: "Yok" } },
        arbitraryHtml: "<script>alert(1)</script>",
      },
    });
    expect(result.content).toEqual({
      schemaVersion: 1,
      hero: { heading: "Kurumsal yapı", body: ["Açıklama"], eyebrow: undefined, action: undefined,
        mediaId: undefined, decorativeMedia: false },
      sections: { overview: { heading: "Genel bakış", body: [], eyebrow: undefined, action: undefined,
        mediaId: undefined, decorativeMedia: false } },
      legalBlocks: [],
    });
    expect(JSON.stringify(result.content)).not.toContain("script");
  });

  it("rejects malformed content and unsafe or looping redirect paths", () => {
    expect(() => validatePageDraftInput({ routeKey: "corporate", locale: "tr", title: "Kurumsal", content: {} }))
      .toThrowError("content_hero_heading_required");
    expect(() => validateSlugRedirect({ locale: "tr", oldPath: "/en/old", newPath: "/tr/new" }))
      .toThrowError("slug_redirect_invalid");
    expect(() => validateSlugRedirect({ locale: "tr", oldPath: "/tr/same", newPath: "/tr/same" }))
      .toThrowError("slug_redirect_invalid");
  });

  it("validates public media by extension, MIME, signature, size and measured dimensions", () => {
    expect(validatePublicMediaUpload({ originalFilename: "depo.png", mimeType: "image/png", bytes: png() }))
      .toEqual({ mimeType: "image/png", width: 1200, height: 800 });
    expect(() => validatePublicMediaUpload({ originalFilename: "depo.jpg", mimeType: "image/png", bytes: png() }))
      .toThrowError("media_extension_not_allowed");
    expect(() => validatePublicMediaUpload({ originalFilename: "depo.png", mimeType: "image/png", bytes: new Uint8Array(24) }))
      .toThrowError("media_signature_or_dimensions_invalid");
  });
});
