import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: ".test-results/playwright",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: process.env.CI
    ? [["line"], ["html", { open: "never", outputFolder: ".test-results/playwright-report" }]]
    : "line",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "corepack pnpm run start:e2e",
    url: `${baseURL}/tr`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      APP_ENV: "test",
      SITE_URL: baseURL,
      APP_BASE_URL: baseURL,
      DEALER_PORTAL_URL: "https://online.bsdotomotiv.com/web",
      DEALER_PORTAL_ALLOWED_HOSTS: "online.bsdotomotiv.com",
      CANDIDATE_RETENTION_DAYS: "30",
      CONTACT_RETENTION_DAYS: "30",
      FORM_PRIVACY_NOTICE_VERSION: "e2e-v1",
      RATE_LIMIT_HASH_SECRET: "e2e-only-rate-limit-secret-32-chars-minimum",
      E2E_UI_TEST_SURFACE: "enabled",
    },
  },
  globalSetup: "./tests/e2e/global-setup.ts",
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    { name: "mobile-webkit", use: { ...devices["iPhone 15"] } },
  ],
});
