import {
  addCareerApplicationNote,
  applicationStatuses,
  type ApplicationStatus,
} from "@/admin/career-applications";
import { readAdminJson } from "@/admin/http";
import {
  adminApiError,
  resolveRequestAdminPrincipal,
} from "@/admin/request-access";
import { getRuntimeDatabase } from "@/db/runtime";
import { updateCandidateStatus } from "@/security/admin-mutations";
import { S3CvObjectStorage } from "@/security/cv/storage";
import { InvalidSecurityInputError } from "@/security/errors";
import {
  anonymizeCandidate,
  deleteCandidate,
} from "@/security/privacy-retention";
import { assertAuthorized } from "@/security/rbac/authorization";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ applicationId: string }> },
) {
  try {
    const [{ applicationId }, body, principal] = await Promise.all([
      context.params,
      readAdminJson(request, 16 * 1024),
      resolveRequestAdminPrincipal(),
    ]);
    const { db } = getRuntimeDatabase();
    if (body.action === "status") {
      if (!applicationStatuses.includes(body.status as ApplicationStatus)) {
        throw new InvalidSecurityInputError("application_status_invalid");
      }
      await updateCandidateStatus(
        db,
        principal,
        applicationId,
        body.status as ApplicationStatus,
      );
      return Response.json({ id: applicationId, status: body.status });
    }
    if (body.action === "note") {
      return Response.json(
        await addCareerApplicationNote(
          db,
          principal,
          applicationId,
          String(body.body ?? ""),
        ),
      );
    }
    if (body.action === "anonymize") {
      assertAuthorized(principal, {
        permission: "Applications:anonymize",
        scope: "retention",
        environment: process.env.APP_ENV,
      });
      await anonymizeCandidate(
        db,
        S3CvObjectStorage.fromEnvironment(),
        principal,
        applicationId,
      );
      return Response.json({ id: applicationId, anonymized: true });
    }
    if (body.action === "delete") {
      assertAuthorized(principal, {
        permission: "Applications:delete",
        scope: "all",
        environment: process.env.APP_ENV,
      });
      await deleteCandidate(
        db,
        S3CvObjectStorage.fromEnvironment(),
        principal,
        applicationId,
      );
      return Response.json({ id: applicationId, deleted: true });
    }
    throw new InvalidSecurityInputError("application_action_invalid");
  } catch (error) {
    return adminApiError(error);
  }
}
