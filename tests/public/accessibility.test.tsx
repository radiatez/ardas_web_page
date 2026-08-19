// @vitest-environment jsdom

import axe from "axe-core";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PublicFooter } from "../../src/components/public/public-footer";
import { PublicHomepage } from "../../src/components/public/public-homepage";
import { SystemState } from "../../src/components/public/system-state";
import { getPublicPageBundle } from "../../src/public/content-repository";

afterEach(() => cleanup());

describe("public shell automated accessibility", () => {
  it("has no detectable semantic accessibility violations", async () => {
    const { container } = render(
      <>
        <SystemState kind="not-found" locale="en" />
        <PublicFooter
          dealerPortal={{ enabled: false, source: "disabled" }}
          locale="en"
        />
      </>,
    );

    const result = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });

    expect(result.violations).toEqual([]);
  });

  it("gives the complete public homepage no detectable semantic violations", async () => {
    const bundle = await getPublicPageBundle("home", "tr", { APP_ENV: "test" });
    if (!bundle) throw new Error("Expected test content bundle.");
    const { container } = render(<PublicHomepage bundle={bundle} />);

    const result = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });

    expect(result.violations).toEqual([]);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector("main")?.scrollWidth).toBeLessThanOrEqual(
      container.querySelector("main")?.clientWidth ?? 0,
    );
  });

  it("limits the homepage portfolio to records explicitly marked featured", async () => {
    const bundle = await getPublicPageBundle("home", "en", { APP_ENV: "test" });
    if (!bundle) throw new Error("Expected test content bundle.");
    const { container } = render(
      <PublicHomepage
        bundle={{
          ...bundle,
          brands: [
            { id: "featured", name: "Featured CMS brand", description: null, featured: true, media: null },
            { id: "ordinary", name: "Ordinary CMS brand", description: null, featured: false, media: null },
          ],
        }}
      />,
    );

    expect(container.textContent).toContain("Featured CMS brand");
    expect(container.textContent).not.toContain("Ordinary CMS brand");
  });
});
