import { getAuth0Client } from "@/auth/auth0";
import { resolveAdminPrincipal } from "@/auth/admin-access";
import { getRuntimeDatabase } from "@/db/runtime";
import { downloadProtectedCv } from "@/security/cv/download";
import { S3CvObjectStorage } from "@/security/cv/storage";
import { SecurityBoundaryError } from "@/security/errors";
import { securityLogger } from "@/security/logging";
import { assertAuthorized } from "@/security/rbac/authorization";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ applicationId: string }> },
) {
  try {
    const session = await getAuth0Client().getSession();
    const { db } = getRuntimeDatabase();
    const principal = await resolveAdminPrincipal(db, session);
    const { applicationId } = await context.params;
    assertAuthorized(principal, {
      permission: "Applications:cv-download",
      requireMfa: true,
      environment: process.env.APP_ENV,
    });
    const object = await downloadProtectedCv(
      db,
      S3CvObjectStorage.fromEnvironment(),
      principal,
      applicationId,
    );
    const responseBody = new ArrayBuffer(object.bytes.byteLength);
    new Uint8Array(responseBody).set(object.bytes);

    return new Response(responseBody, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": 'attachment; filename="cv.pdf"',
        "Content-Type": object.contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof SecurityBoundaryError) {
      return Response.json({ error: error.code }, { status: error.status });
    }
    securityLogger.error("security.cv_download_failed", { error });
    return Response.json({ error: "service_unavailable" }, { status: 503 });
  }
}
