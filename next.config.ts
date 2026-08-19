import type { NextConfig } from "next";

export const rootRedirect = {
  source: "/",
  destination: "/tr",
  permanent: false,
} as const;

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

export function resolvePublicMediaRemotePattern(value = process.env.PUBLIC_MEDIA_BASE_URL) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return undefined;
    return {
      protocol: "https" as const,
      hostname: url.hostname,
      port: url.port,
      pathname: `${url.pathname.replace(/\/$/, "")}/**`,
    };
  } catch {
    return undefined;
  }
}

export const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
] as const;

const publicMediaRemotePattern = resolvePublicMediaRemotePattern();

const nextConfig: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  images: publicMediaRemotePattern
    ? { remotePatterns: [publicMediaRemotePattern] }
    : undefined,
  async redirects() {
    return [rootRedirect];
  },
  async headers() {
    return [{ source: "/:path*", headers: [...securityHeaders] }];
  },
};

export default nextConfig;
