import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DealerPortalLink } from "../../src/components/public/dealer-portal-link";

describe("Dealer Portal presentation", () => {
  it("renders a safe external link only for an enabled secure resolution", () => {
    const html = renderToStaticMarkup(
      <DealerPortalLink
        label="Bayi Otomasyonu"
        placement="header"
        resolution={{
          enabled: true,
          source: "site_setting",
          url: "https://online.bsdotomotiv.com/web",
        }}
        unavailableLabel="Kullanılamıyor"
      />,
    );

    expect(html).toContain('href="https://online.bsdotomotiv.com/web"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("renders an inaccessible disabled state when resolution is unavailable", () => {
    const html = renderToStaticMarkup(
      <DealerPortalLink
        label="Dealer Portal"
        placement="footer"
        resolution={{ enabled: false, source: "disabled" }}
        unavailableLabel="Unavailable"
      />,
    );

    expect(html).not.toContain("<a");
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('data-enabled="false"');
  });

  it("does not hard-code configuration inside public presentation components", () => {
    for (const file of [
      "src/components/public/dealer-portal-link.tsx",
      "src/components/public/public-header.tsx",
      "src/components/public/public-footer.tsx",
    ]) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(source).not.toContain("online.bsdotomotiv.com");
      expect(source).not.toContain("DEALER_PORTAL_URL");
      expect(source).not.toContain("siteSettings");
    }
  });
});
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
