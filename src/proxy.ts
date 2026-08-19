import { NextResponse, type NextRequest } from "next/server";

import {
  getAuth0Client,
  hasCompleteAuth0Configuration,
} from "./auth/auth0";
import { demoMediaRequestIsAllowed } from "./content/development-content";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (
    !demoMediaRequestIsAllowed(
      pathname,
      process.env,
      request.nextUrl.searchParams.get("url"),
    )
  ) {
    return new NextResponse(null, { status: 404 });
  }

  if (pathname === "/_next/image") {
    return NextResponse.next();
  }

  if (!hasCompleteAuth0Configuration()) {
    const protectedPath =
      pathname === "/admin" ||
      pathname.startsWith("/admin/") ||
      pathname.startsWith("/api/admin/") ||
      pathname === "/auth" ||
      pathname.startsWith("/auth/");
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
    "/_next/image",
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
