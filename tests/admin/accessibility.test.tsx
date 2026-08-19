// @vitest-environment jsdom

import axe from "axe-core";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminPageEditor, ContactActions } from "../../src/components/admin/admin-controls";

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
});
