import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";

const baseUrl = process.env.SCREENSHOT_BASE_URL ?? "http://127.0.0.1:3100";
const outputDirectory = resolve(".test-results", "final-screenshots");

const publicPages = [
  ["homepage-desktop", "/tr", { width: 1440, height: 1000 }],
  ["homepage-mobile", "/tr", { width: 390, height: 844 }],
  ["corporate", "/tr/kurumsal", { width: 1440, height: 1000 }],
  ["brands", "/tr/markalar", { width: 1440, height: 1000 }],
  ["locations", "/tr/depolar", { width: 1440, height: 1000 }],
  ["career-application", "/tr/kariyer/basvuru", { width: 1440, height: 1000 }],
  ["contact", "/tr/iletisim", { width: 1440, height: 1000 }],
];

async function settleResponsiveMedia(page) {
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight * 0.8, 320);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolveDelay) => window.setTimeout(resolveDelay, 40));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
}

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [name, route, viewport] of publicPages) {
    const page = await browser.newPage({ viewport });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const response = await page.goto(new URL(route, baseUrl).toString(), {
      waitUntil: "networkidle",
    });
    if (!response?.ok()) throw new Error(`${name} returned ${response?.status() ?? "no response"}`);
    await settleResponsiveMedia(page);
    await page.screenshot({
      fullPage: true,
      path: resolve(outputDirectory, `${name}.png`),
    });
    await page.close();
  }

  const admin = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const adminResponse = await admin.goto(
    new URL("/e2e-test-surface/admin-ui", baseUrl).toString(),
    { waitUntil: "domcontentloaded" },
  );
  if (adminResponse?.ok()) {
    await admin.waitForTimeout(500);
    await admin.screenshot({
      fullPage: true,
      path: resolve(outputDirectory, "admin-dashboard.png"),
    });
    for (const [name, selector] of [
      ["admin-cms-page-edit", "#cms"],
      ["admin-contact-inbox", "#contact"],
      ["admin-hr-applications", "#applications"],
    ]) {
      await admin.locator(selector).screenshot({
        path: resolve(outputDirectory, `${name}.png`),
      });
    }
  }
  await admin.close();
} finally {
  await browser.close();
}

process.stdout.write(`Final screenshots written to ${outputDirectory}\n`);
