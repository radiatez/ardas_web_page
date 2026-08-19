// @vitest-environment jsdom

import axe from "axe-core";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminPageEditor, ContactActions } from "../../src/components/admin/admin-controls";
import { getTemporaryLegalSeedPage } from "../../src/content/temporary-legal-content";

afterEach(() => cleanup());

describe("admin UI accessibility", () => {
  it("keeps editor and contact controls semantically labelled", async () => {
    const { container } = render(<><AdminPageEditor routeKey="corporate" locale="tr" initial={{
      title: "Kurumsal", content: { schemaVersion: 1, hero: { heading: "Kurumsal", body: [] }, sections: {}, legalBlocks: [] },
      seoTitle: null, seoDescription: null, ogTitle: null, ogDescription: null, ogMediaId: null,
      allowIndexing: true, publishStatus: "draft", hasDraft: true,
    }} /><ContactActions id="00000000-0000-4000-8000-000000000001" currentStatus="new" /></>);
    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations).toEqual([]);
  });

  it("shows the temporary legal-review status only in admin", () => {
    const legal = getTemporaryLegalSeedPage("privacy", "tr");
    const { container } = render(<AdminPageEditor routeKey="privacy" locale="tr" initial={{
      title: legal.title, content: legal.content,
      seoTitle: legal.seoTitle, seoDescription: legal.seoDescription,
      ogTitle: null, ogDescription: null, ogMediaId: null,
      allowIndexing: false, publishStatus: "published",
    }} />);
    expect(container.textContent).toContain("Geçici metin — hukuk onayı bekleniyor");
    expect(container.textContent).toContain("TEMP-2026-08-V1");
  });
});
