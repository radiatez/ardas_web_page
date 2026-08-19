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

export function demoMediaRequestIsAllowed(
  pathname: string,
  environment: DevelopmentContentEnvironment = process.env,
  optimizedSource?: string | null,
): boolean {
  const requestsDemoAsset =
    pathname.startsWith("/demo-media/") ||
    (pathname === "/_next/image" &&
      Boolean(optimizedSource?.startsWith("/demo-media/")));

  return (
    !requestsDemoAsset ||
    developmentContentIsEnabled(environment)
  );
}
