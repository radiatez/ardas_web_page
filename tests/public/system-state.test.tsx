import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LegalPageShell } from "../../src/components/public/legal-page-shell";
import { SystemState } from "../../src/components/public/system-state";

describe("localized public system states", () => {
  it("renders Turkish 404 copy without exposing implementation detail", () => {
    const html = renderToStaticMarkup(<SystemState kind="not-found" locale="tr" />);
    expect(html).toContain("Aradığınız sayfa burada değil.");
    expect(html).toContain('href="/tr"');
    expect(html).not.toContain("stack");
  });

  it("renders English 500 copy and a retry action", () => {
    const html = renderToStaticMarkup(
      <SystemState kind="error" locale="en" onRetry={() => undefined} />,
    );
    expect(html).toContain("Something went wrong.");
    expect(html).toContain("Try again");
    expect(html).toContain('href="/en"');
  });

  it("keeps legal copy explicitly approval-gated", () => {
    const html = renderToStaticMarkup(
      <LegalPageShell locale="en" routeKey="privacy" />,
    );
    expect(html).toContain("Approved content is pending.");
    expect(html).toContain("Content: TBD.");
  });
});
