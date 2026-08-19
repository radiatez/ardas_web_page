export type DevelopmentContentEnvironment = {
  APP_ENV?: string;
  NODE_ENV?: string;
};

export function developmentContentIsEnabled(
  environment: DevelopmentContentEnvironment = process.env,
): boolean {
  return (
    environment.APP_ENV === "local" ||
    environment.APP_ENV === "test" ||
    (!environment.APP_ENV && environment.NODE_ENV !== "production")
  );
}
