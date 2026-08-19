import { NextRequest, NextResponse } from "next/server";

import {
  getAuth0Client,
  hasCompleteAuth0Configuration,
} from "./auth/auth0";
import {
  buildContentSecurityPolicy,
  createCspNonce,
  isPrivateApplicationPath,
} from "./security/csp";

function securedRequestHeaders(request: NextRequest, policy: string, nonce: string) {
  const headers = new Headers(request.headers);
  headers.set("Content-Security-Policy", policy);
  headers.set("x-nonce", nonce);
  return headers;
}

function finalizeResponse(
  response: NextResponse,
  pathname: string,
  policy: string,
): NextResponse {
  response.headers.set("Content-Security-Policy", policy);
  if (isPrivateApplicationPath(pathname)) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
  }
  return response;
}

function continueWithSecurity(
  request: NextRequest,
  requestHeaders: Headers,
  pathname: string,
  policy: string,
  upstream?: NextResponse,
): NextResponse {
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (upstream) {
    for (const [key, value] of upstream.headers) {
      if (!key.startsWith("x-middleware-") && key !== "set-cookie") {
        response.headers.append(key, value);
      }
    }
    for (const cookie of upstream.headers.getSetCookie()) {
      response.headers.append("set-cookie", cookie);
    }
  }
  return finalizeResponse(response, pathname, policy);
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const nonce = createCspNonce();
  const policy = buildContentSecurityPolicy(nonce);
  const requestHeaders = securedRequestHeaders(request, policy, nonce);
  if (pathname === "/_next/image") {
    return continueWithSecurity(request, requestHeaders, pathname, policy);
  }

  if (!hasCompleteAuth0Configuration()) {
    const protectedPath =
      pathname === "/admin" ||
      pathname.startsWith("/admin/") ||
      pathname.startsWith("/api/admin/") ||
      pathname === "/preview" ||
      pathname.startsWith("/preview/") ||
      pathname === "/auth" ||
      pathname.startsWith("/auth/");
    if (protectedPath) {
      return finalizeResponse(
        NextResponse.json(
          { error: "admin_authentication_unavailable" },
          { status: 503 },
        ),
        pathname,
        policy,
      );
    }
    return continueWithSecurity(request, requestHeaders, pathname, policy);
  }
  const securedRequest = new NextRequest(request, { headers: requestHeaders });
  const authResponse = await getAuth0Client(nonce).middleware(securedRequest);
  if (authResponse.headers.get("x-middleware-next") === "1") {
    return continueWithSecurity(
      request,
      requestHeaders,
      pathname,
      policy,
      authResponse,
    );
  }
  return finalizeResponse(authResponse, pathname, policy);
}

export const config = {
  matcher: [
    "/_next/image",
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
