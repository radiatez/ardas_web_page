import { describe, expect, it } from "vitest";

import { e2eUiTestSurfaceIsEnabled } from "../../src/security/test-surfaces";

describe("test-only UI surfaces", () => {
  it("requires two explicit test-only runtime gates", () => {
    expect(e2eUiTestSurfaceIsEnabled({ APP_ENV: "test", E2E_UI_TEST_SURFACE: "enabled" })).toBe(true);
    expect(e2eUiTestSurfaceIsEnabled({ APP_ENV: "production", E2E_UI_TEST_SURFACE: "enabled" })).toBe(false);
    expect(e2eUiTestSurfaceIsEnabled({ APP_ENV: "test" })).toBe(false);
    expect(e2eUiTestSurfaceIsEnabled({})).toBe(false);
  });
});
