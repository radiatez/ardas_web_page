import type { MetadataRoute } from "next";

import { resolveMetadataBaseUrl } from "@/public/metadata";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = resolveMetadataBaseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/preview/",
        "/e2e-test-surface/",
        "/tr/design-system-preview",
        "/en/design-system-preview",
        "/tr/locale-switch/",
        "/en/locale-switch/",
      ],
    },
    sitemap: baseUrl ? new URL("/sitemap.xml", baseUrl).toString() : undefined,
  };
}
