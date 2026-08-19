import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

function collectRuntimeFailures(page: Page) {
  const failures: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(message.text());
  });
  page.on("pageerror", (error) => failures.push(error.message));
  return failures;
}

async function expectNoSeriousAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.filter((violation) =>
      violation.impact === "critical" || violation.impact === "serious"),
  ).toEqual([]);
}

test("public navigation, locale switch, CSP and accessibility", async ({ page }) => {
  const failures = collectRuntimeFailures(page);
  const response = await page.goto("/tr", { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  const csp = response?.headers()["content-security-policy"] ?? "";
  expect(csp).toContain("strict-dynamic");
  expect(csp).toContain("style-src-attr 'unsafe-hashes' 'sha256-");
  expect(csp).not.toContain("unsafe-inline");
  expect(csp).not.toContain("unsafe-eval");
  await expect(page.locator("html")).toHaveAttribute("lang", "tr");
  await expect(page.locator("h1")).toHaveCount(1);
  await expectNoSeriousAxeViolations(page);

  await page.getByRole("link", {
    name: "Dili İngilizce olarak değiştir",
  }).first().click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.waitForLoadState("networkidle");

  const missing = await page.goto("/en/not-a-real-route", { waitUntil: "networkidle" });
  expect(missing?.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expectNoSeriousAxeViolations(page);
  await page.waitForLoadState("networkidle");
  expect(failures.filter((failure) => /content security policy/i.test(failure))).toEqual([]);
});

test("forms expose safe validation and localized accessible controls", async ({ page, request }) => {
  await page.goto("/tr/iletisim", { waitUntil: "networkidle" });
  await expect(page.getByLabel("Ad Soyad")).toBeVisible();
  await expectNoSeriousAxeViolations(page);
  await page.getByRole("button", { name: "Mesajı gönder" }).click();
  await expect(page.getByLabel("Ad Soyad")).toBeFocused();

  const malformed = await request.post("/api/contact", {
    headers: {
      "content-type": "application/json",
      origin: "http://127.0.0.1:3100",
      "accept-language": "en",
    },
    data: { locale: "invalid", unexpected: "field" },
  });
  expect(malformed.status()).toBe(400);
  expect(await malformed.json()).toMatchObject({ error: "validation_failed" });

  const wrongContentType = await request.post("/api/contact", {
    headers: {
      "content-type": "text/plain",
      origin: "http://127.0.0.1:3100",
    },
    data: "{}",
  });
  expect(wrongContentType.status()).toBe(415);
  expect(await wrongContentType.json()).toMatchObject({ error: "unsupported_media_type" });

  await page.goto("/tr/kariyer/basvuru", { waitUntil: "networkidle" });
  await expect(page.getByLabel("CV")).toHaveAttribute("accept", ".pdf,application/pdf");
  await expectNoSeriousAxeViolations(page);
});

test("Dealer Portal stays separated and private surfaces fail closed with no-store", async ({ page, request }) => {
  await page.goto("/tr", { waitUntil: "domcontentloaded" });
  const portal = page.locator('a[href="https://online.bsdotomotiv.com/web"]').first();
  await expect(portal).toHaveAttribute("target", "_blank");
  await expect(portal).toHaveAttribute("rel", /noopener/);

  const admin = await request.get("/admin");
  expect(admin.status()).toBe(503);
  expect(admin.headers()["cache-control"]).toContain("no-store");
  expect(admin.headers()["content-security-policy"]).not.toContain("unsafe-inline");

  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /admin/");
});

test("admin CMS and HR critical UI stay accessible in the isolated test surface", async ({ page }) => {
  const response = await page.goto("/e2e-test-surface/admin-ui", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  expect(response?.headers()["cache-control"]).toContain("no-store");
  await expect(page.getByRole("heading", { name: "Yönetim arayüzü doğrulaması" })).toBeVisible();
  await expect(page.getByLabel("Sayfa başlığı")).toHaveValue("Kurumsal");
  await expect(page.getByRole("table", { name: "Test aday başvuruları" })).toBeVisible();
  await expect(page.getByLabel("Yeni durum")).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expectNoSeriousAxeViolations(page);

  const skipLink = page.getByRole("link", { name: "Ana içeriğe geç" });
  await skipLink.focus();
  await skipLink.press("Enter");
  await expect(page.locator("#admin-main-content")).toBeFocused();

  const deleteTrigger = page.getByRole("button", { name: "Kalıcı silme override" });
  await deleteTrigger.click();
  const dialog = page.getByRole("alertdialog", { name: "İşlemi onaylayın" });
  await expect(dialog.getByRole("button", { name: "Onayla" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Vazgeç" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(deleteTrigger).toBeFocused();
});

test("mobile menu traps and returns focus", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile-"), "mobile projects only");
  await page.goto("/tr", { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", { name: "Menüyü aç" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Ana navigasyon" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("link", { name: /Bayi Otomasyonu/ })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("responsive matrix has no horizontal overflow and reduced motion is honored", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "single-engine viewport matrix");
  for (const viewport of [
    { width: 320, height: 720 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/tr", { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      const offenders = [...document.querySelectorAll<HTMLElement>("body *")]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${[
              ...element.classList,
            ].map((className) => `.${className}`).join("")}`,
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          };
        })
        .filter(({ left, right }) => left < -1 || right > root.clientWidth + 1)
        .slice(0, 8);
      return {
        pixels: root.scrollWidth - root.clientWidth,
        offenders,
      };
    });
    expect(
      overflow.pixels,
      `${viewport.width}x${viewport.height}: ${JSON.stringify(overflow.offenders)}`,
    ).toBeLessThanOrEqual(1);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/tr", { waitUntil: "networkidle" });
  const animation = await page.locator(".motion-reveal").first().evaluate((element) => {
    const style = getComputedStyle(element);
    return { duration: style.animationDuration, name: style.animationName };
  });
  expect(animation.name === "none" || animation.duration === "0.01ms").toBe(true);
});

test("Chromium lab budget records LCP, CLS and delivered JavaScript", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Chromium performance diagnostics");
  await page.addInitScript(() => {
    const metrics = { cls: 0, lcp: 0 };
    Object.defineProperty(window, "__ardasLabMetrics", { value: metrics });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) metrics.lcp = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) {
        if (!entry.hadRecentInput) metrics.cls += entry.value ?? 0;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto("/tr", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const metrics = await page.evaluate(() => {
    const lab = (window as typeof window & { __ardasLabMetrics: { cls: number; lcp: number } }).__ardasLabMetrics;
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    return {
      ...lab,
      jsBytes: resources
        .filter((entry) => entry.initiatorType === "script" || entry.name.endsWith(".js"))
        .reduce((total, entry) => total + entry.transferSize, 0),
    };
  });
  console.log(`M8_LAB ${JSON.stringify(metrics)}`);
  expect(metrics.cls).toBeLessThanOrEqual(0.1);
  expect(metrics.lcp).toBeGreaterThan(0);
  expect(metrics.lcp).toBeLessThanOrEqual(2_500);
  expect(metrics.jsBytes).toBeLessThanOrEqual(500_000);
});
