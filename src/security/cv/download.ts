import { and, eq } from "drizzle-orm";

import type { DatabaseClient } from "../../db/client";
import { careerApplications, media } from "../../db/schema";
import { appendAuditEvent } from "../audit";
import { ResourceNotFoundError } from "../errors";
import {
  assertAuthorized,
  type AdminPrincipal,
} from "../rbac/authorization";
import type { CvObjectStorage, ProtectedCvObject } from "./storage";

export async function downloadProtectedCv(
  db: DatabaseClient,
  storage: CvObjectStorage,
  principal: AdminPrincipal | null,
  applicationId: string,
): Promise<ProtectedCvObject> {
  assertAuthorized(principal, {
    permission: "Applications:cv-download",
    requireMfa: true,
  });
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      applicationId,
    )
  ) {
    throw new ResourceNotFoundError();
  }

  const [record] = await db
    .select({
      mediaId: media.id,
      storageKey: media.storageKey,
      storageClass: media.storageClass,
      scanStatus: media.scanStatus,
    })
    .from(careerApplications)
    .innerJoin(media, eq(media.id, careerApplications.cvFileId))
    .where(
      and(
        eq(careerApplications.id, applicationId),
        eq(media.storageClass, "protected"),
        eq(media.scanStatus, "clean"),
      ),
    )
    .limit(1);

  if (!record) {
    throw new ResourceNotFoundError();
  }

  const object = await storage.readProtected(record.storageKey);
  await appendAuditEvent(db, {
    actorUserId: principal.userId,
    eventType: "privacy.cv_downloaded",
    resourceType: "career_application",
    resourceId: applicationId,
    metadata: { mediaId: record.mediaId },
  });
  return object;
}
