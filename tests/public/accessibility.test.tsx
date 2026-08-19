// @vitest-environment jsdom

import axe from "axe-core";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PublicFooter } from "../../src/components/public/public-footer";
import { SystemState } from "../../src/components/public/system-state";

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
});
