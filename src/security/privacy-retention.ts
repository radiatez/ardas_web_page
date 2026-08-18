import { and, eq, isNull, lte, or } from "drizzle-orm";

import type { DatabaseClient } from "../db/client";
import {
  careerApplicationNotes,
  careerApplications,
  contactSubmissions,
  media,
  rateLimitBuckets,
  siteSettings,
} from "../db/schema";
import { appendAuditEvent } from "./audit";
import { ResourceNotFoundError } from "./errors";
import {
  assertAuthorized,
  type AdminPrincipal,
} from "./rbac/authorization";
import type { CvObjectStorage } from "./cv/storage";

interface CandidateFile {
  id: string;
  storageKey: string;
  storageClass: "public" | "protected" | "quarantine";
}

async function findCandidateFile(
  db: DatabaseClient,
  applicationId: string,
): Promise<{ exists: boolean; file?: CandidateFile }> {
  const [row] = await db
    .select({
      applicationId: careerApplications.id,
      mediaId: media.id,
      storageKey: media.storageKey,
      storageClass: media.storageClass,
    })
    .from(careerApplications)
    .leftJoin(media, eq(media.id, careerApplications.cvFileId))
    .where(eq(careerApplications.id, applicationId))
    .limit(1);
  if (!row) {
    return { exists: false };
  }
  if (!row.mediaId || !row.storageKey || !row.storageClass) {
    return { exists: true };
  }
  return {
    exists: true,
    file: {
      id: row.mediaId,
      storageKey: row.storageKey,
      storageClass: row.storageClass,
    },
  };
}

async function deleteCandidateObject(
  storage: CvObjectStorage,
  file: CandidateFile | undefined,
): Promise<void> {
  if (!file) {
    return;
  }
  if (file.storageClass === "protected") {
    await storage.deleteProtected(file.storageKey);
  } else if (file.storageClass === "quarantine") {
    await storage.deleteQuarantine(file.storageKey);
  }
}

async function anonymizeCandidateCore(
  db: DatabaseClient,
  storage: CvObjectStorage,
  applicationId: string,
  actorUserId: string | null,
  source: "manual" | "scheduled_retention",
) {
  const candidate = await findCandidateFile(db, applicationId);
  if (!candidate.exists) {
    throw new ResourceNotFoundError();
  }
  await deleteCandidateObject(storage, candidate.file);
  const now = new Date();

  await db.transaction(async (transaction) => {
    await transaction
      .delete(careerApplicationNotes)
      .where(eq(careerApplicationNotes.applicationId, applicationId));
    await transaction
      .update(careerApplications)
      .set({
        firstName: null,
        lastName: null,
        phoneNormalized: null,
        emailNormalized: null,
        gender: null,
        birthDate: null,
        maritalStatus: null,
        militaryStatus: null,
        defermentDate: null,
        knowsCompany: false,
        knowsCompanySource: null,
        expectedSalaryTry: null,
        availableFrom: null,
        aboutText: null,
        cvFileId: null,
        status: "archived",
        anonymizedAt: now,
        updatedAt: now,
      })
      .where(eq(careerApplications.id, applicationId));
    if (candidate.file) {
      await transaction.delete(media).where(eq(media.id, candidate.file.id));
    }
    await appendAuditEvent(transaction, {
      actorUserId,
      eventType: "privacy.candidate_anonymized",
      resourceType: "career_application",
      resourceId: applicationId,
      metadata: { source },
    });
  });
}

export async function anonymizeCandidate(
  db: DatabaseClient,
  storage: CvObjectStorage,
  principal: AdminPrincipal | null,
  applicationId: string,
) {
  assertAuthorized(principal, {
    permission: "Applications:anonymize",
    scope: "retention",
    environment: process.env.APP_ENV,
  });
  return anonymizeCandidateCore(
    db,
    storage,
    applicationId,
    principal.userId,
    "manual",
  );
}

export async function deleteCandidate(
  db: DatabaseClient,
  storage: CvObjectStorage,
  principal: AdminPrincipal | null,
  applicationId: string,
) {
  assertAuthorized(principal, {
    permission: "Applications:delete",
    scope: "retention",
    environment: process.env.APP_ENV,
  });
  const candidate = await findCandidateFile(db, applicationId);
  if (!candidate.exists) {
    throw new ResourceNotFoundError();
  }
  await deleteCandidateObject(storage, candidate.file);
  await db.transaction(async (transaction) => {
    await transaction
      .delete(careerApplications)
      .where(eq(careerApplications.id, applicationId));
    if (candidate.file) {
      await transaction.delete(media).where(eq(media.id, candidate.file.id));
    }
    await appendAuditEvent(transaction, {
      actorUserId: principal.userId,
      eventType: "privacy.candidate_deleted",
      resourceType: "career_application",
      resourceId: applicationId,
      metadata: { source: "manual" },
    });
  });
}

export async function runRetentionCleanup(
  db: DatabaseClient,
  storage: CvObjectStorage,
  options: { now?: Date; limit?: number } = {},
) {
  const now = options.now ?? new Date();
  const limit = Math.min(100, Math.max(1, options.limit ?? 25));
  const candidates = await db
    .select({ id: careerApplications.id })
    .from(careerApplications)
    .where(
      and(
        isNull(careerApplications.anonymizedAt),
        lte(careerApplications.retentionDueAt, now),
        or(
          isNull(careerApplications.retentionHoldUntil),
          lte(careerApplications.retentionHoldUntil, now),
        ),
      ),
    )
    .limit(limit);

  let candidateCount = 0;
  for (const candidate of candidates) {
    await anonymizeCandidateCore(
      db,
      storage,
      candidate.id,
      null,
      "scheduled_retention",
    );
    candidateCount += 1;
  }

  const contacts = await db
    .select({ id: contactSubmissions.id })
    .from(contactSubmissions)
    .where(
      and(
        isNull(contactSubmissions.anonymizedAt),
        lte(contactSubmissions.retentionDueAt, now),
        or(
          isNull(contactSubmissions.retentionHoldUntil),
          lte(contactSubmissions.retentionHoldUntil, now),
        ),
      ),
    )
    .limit(limit);
  for (const contact of contacts) {
    await db.transaction(async (transaction) => {
      await transaction
        .update(contactSubmissions)
        .set({
          name: null,
          company: null,
          emailNormalized: null,
          phoneNormalized: null,
          subject: null,
          message: null,
          status: "archived",
          anonymizedAt: now,
        })
        .where(eq(contactSubmissions.id, contact.id));
      await appendAuditEvent(transaction, {
        eventType: "privacy.contact_anonymized",
        resourceType: "contact_submission",
        resourceId: contact.id,
        metadata: { source: "scheduled_retention" },
      });
    });
  }

  const expiredRateBuckets = await db
    .delete(rateLimitBuckets)
    .where(lte(rateLimitBuckets.expiresAt, now))
    .returning({ id: rateLimitBuckets.id });

  return {
    candidates: candidateCount,
    contacts: contacts.length,
    expiredRateBuckets: expiredRateBuckets.length,
  };
}

type RetentionSettingKey =
  | "candidate_retention_days"
  | "contact_retention_days"
  | "audit_retention_days";

export async function resolveRetentionDays(
  db: DatabaseClient,
  settingKey: RetentionSettingKey,
  environmentValue: string | undefined,
): Promise<number | undefined> {
  const [setting] = await db
    .select({ value: siteSettings.typedValue })
    .from(siteSettings)
    .where(eq(siteSettings.key, settingKey))
    .limit(1);
  const candidate = setting?.value ?? environmentValue;
  const parsed = typeof candidate === "number" ? candidate : Number(candidate);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}
