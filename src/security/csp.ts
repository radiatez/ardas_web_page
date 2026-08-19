type CspEnvironment = Readonly<Record<string, string | undefined>>;

function httpsOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return undefined;
    }
    return url.origin;
  } catch {
    return undefined;
  }
}

function unique(values: readonly (string | undefined)[]): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

export function createCspNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes));
}

export function buildContentSecurityPolicy(
  nonce: string,
  environment: CspEnvironment = process.env,
): string {
  const publicMediaOrigin = httpsOrigin(environment.PUBLIC_MEDIA_BASE_URL);
  const development =
    environment.APP_ENV === "local" ||
    environment.APP_ENV === "test" ||
    (!environment.APP_ENV && environment.NODE_ENV !== "production");

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'nonce-" + nonce + "' 'strict-dynamic'",
    "script-src-attr 'none'",
    "style-src 'self' 'nonce-" + nonce + "'",
    "style-src-attr 'unsafe-hashes' 'sha256-zlqnbDt84zf1iSefLU/ImC54isoprH/MRiVZGskwexk='",
    `img-src ${unique(["'self'", "data:", publicMediaOrigin]).join(" ")}`,
    `media-src ${unique(["'self'", publicMediaOrigin]).join(" ")}`,
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-src 'none'",
    ...(development ? [] : ["upgrade-insecure-requests"]),
  ];

  return directives.join("; ");
}

export function isPrivateApplicationPath(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/preview" ||
    pathname.startsWith("/preview/") ||
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname === "/e2e-test-surface" ||
    pathname.startsWith("/e2e-test-surface/")
  );
}
