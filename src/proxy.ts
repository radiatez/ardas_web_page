import { NextResponse, type NextRequest } from "next/server";

import {
  getAuth0Client,
  hasCompleteAuth0Configuration,
} from "./auth/auth0";

export async function proxy(request: NextRequest) {
  if (!hasCompleteAuth0Configuration()) {
    const protectedPath =
      request.nextUrl.pathname === "/admin" ||
      request.nextUrl.pathname.startsWith("/admin/") ||
      request.nextUrl.pathname.startsWith("/api/admin/") ||
      request.nextUrl.pathname === "/auth" ||
      request.nextUrl.pathname.startsWith("/auth/");
    if (protectedPath) {
      return NextResponse.json(
        { error: "admin_authentication_unavailable" },
        { status: 503 },
      );
    }
    return NextResponse.next();
  }
  return getAuth0Client().middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
