import type { NextConfig } from "next";

export const rootRedirect = {
  source: "/",
  destination: "/tr",
  permanent: false,
} as const;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  async redirects() {
    return [rootRedirect];
  },
};

export default nextConfig;
