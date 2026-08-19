import { describe, expect, it } from "vitest";

import {
  legalContentCanPublish,
  privacyNoticeCanEnableProduction,
  readLegalContentMetadata,
  readPrivacyNotice,
  temporaryLegalVersion,
} from "../../src/content/legal-content";
import {
  temporaryLegalSeedPages,
  temporaryPrivacyNotices,
} from "../../src/content/temporary-legal-content";
import { parseLegalControllerDetails } from "../../src/public/legal-controller";

describe("temporary legal content contract", () => {
  it("provides substantive TR/EN CMS seed content with explicit temporary metadata", () => {
    expect(temporaryLegalSeedPages).toHaveLength(6);
    for (const page of temporaryLegalSeedPages) {
      expect(page.content).toMatchObject({
        legal_status: "temporary",
        legal_version: temporaryLegalVersion,
        requires_legal_review: true,
      });
      expect(page.content.legalBlocks.length).toBeGreaterThanOrEqual(6);
      expect(page.allowIndexing).toBe(false);
      expect(JSON.stringify(page)).not.toMatch(
        /lorem ipsum|CMS content waiting|approved legal copy is pending|içerik:\s*TBD/i,
      );
      expect(legalContentCanPublish(page.content)).toBe(true);
    }
  });

  it("keeps the KVKK notice in the required ten-part structure in both locales", () => {
    for (const locale of ["tr", "en"] as const) {
      const page = temporaryLegalSeedPages.find(
        (candidate) =>
          candidate.routeKey === "data-protection" && candidate.locale === locale,
      );
      expect(page?.content.legalBlocks).toHaveLength(10);
      expect(page?.content.legalBlocks.map((block) => block.heading)).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/^1\./),
          expect.stringMatching(/^10\./),
        ]),
      );
    }
  });

  it("documents only the current cookie/storage behaviour", () => {
    for (const locale of ["tr", "en"] as const) {
      const page = temporaryLegalSeedPages.find(
        (candidate) => candidate.routeKey === "cookies" && candidate.locale === locale,
      );
      const copy = JSON.stringify(page);
      expect(copy).toMatch(/Auth0/);
      expect(copy).toMatch(/localStorage/);
      expect(copy).toMatch(locale === "tr" ? /kullanılmamaktadır/ : /currently used/);
      expect(copy).toMatch(locale === "tr" ? /Pazarlama \/ reklam/ : /Marketing \/ advertising/);
      expect(copy).not.toMatch(/Google Analytics|Meta Pixel|Hotjar|Clarity/);
    }
  });

  it("keeps career and contact acknowledgement separate from explicit consent", () => {
    for (const kind of ["career", "contact"] as const) {
      for (const locale of ["tr", "en"] as const) {
        const notice = temporaryPrivacyNotices[kind][locale];
        expect(readPrivacyNotice(notice)).toEqual(notice);
        expect(notice.legal_version).toBe(temporaryLegalVersion);
        expect(notice.requires_legal_review).toBe(true);
        expect(privacyNoticeCanEnableProduction(notice)).toBe(false);
        expect(notice.acknowledgement_label).toMatch(
          locale === "tr" ? /okudum/ : /have read/,
        );
        expect(notice.acknowledgement_label).not.toMatch(
          /açık rıza|consent/i,
        );
      }
    }
  });

  it("requires a reference and review completion before content is approved", () => {
    expect(
      readLegalContentMetadata({
        legal_status: "approved",
        legal_version: "LEGAL-2026-09-V1",
        requires_legal_review: false,
      }),
    ).toBeUndefined();
    expect(
      readLegalContentMetadata({
        legal_status: "approved",
        legal_version: temporaryLegalVersion,
        requires_legal_review: false,
        approval: { status: "approved", reference: "LEGAL-APPROVAL-001" },
      }),
    ).toBeUndefined();
    expect(
      readLegalContentMetadata({
        legal_status: "approved",
        legal_version: "LEGAL-2026-09-V1",
        requires_legal_review: false,
        approval: { status: "approved", reference: "LEGAL-APPROVAL-001" },
      }),
    ).toMatchObject({ legal_status: "approved", requires_legal_review: false });
  });

  it("reads controller identity only from the documented Site Setting shape", () => {
    expect(parseLegalControllerDetails({ legalController: {} })).toBeUndefined();
    expect(
      parseLegalControllerDetails({
        legalController: {
          identity: "Doğrulanmış Ticari Unvan",
          contactChannels: ["Doğrulanmış başvuru kanalı"],
        },
      }),
    ).toEqual({
      identity: "Doğrulanmış Ticari Unvan",
      contactChannels: ["Doğrulanmış başvuru kanalı"],
    });
  });
});
