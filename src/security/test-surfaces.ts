type TestSurfaceEnvironment = Readonly<Record<string, string | undefined>>;

export function e2eUiTestSurfaceIsEnabled(
  environment: TestSurfaceEnvironment = process.env,
): boolean {
  return (
    environment.APP_ENV === "test" &&
    environment.E2E_UI_TEST_SURFACE === "enabled"
  );
}
