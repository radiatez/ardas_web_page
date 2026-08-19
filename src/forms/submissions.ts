import { and, eq, isNull, lt } from "drizzle-orm";

import type { DatabaseClient } from "@/db/client";
import {
  careerApplications,
  contactSubmissions,
  media,
  submissionNotifications,
} from "@/db/schema";
import { appendAuditEvent } from "@/security/audit";
import type { CvObjectStorage } from "@/security/cv/storage";
import { uploadCvToQuarantine } from "@/security/cv/upload";
import { validateCvUpload } from "@/security/cv/validation";
import { securityLogger } from "@/security/logging";

import type { SubmissionRuntimeConfiguration } from "./configuration";
import { PublicFormValidationError } from "./errors";
import {
  attemptSubmissionNotification,
  type SubmissionNotificationSender,
} from "./notifications";
import { loadCareerFormOptions } from "./options";
import {
  validateCareerSubmission,
  validateContactSubmission,
  type RawCareerSubmission,
  type RawContactSubmission,
} from "./validation";

function retentionDueAt(now: Date, days: number): Date {
  return new Date(now.getTime() + days * 24 * 60 * 60_000);
}

export type SubmissionAcceptance = {
  accepted: true;
  duplicate: boolean;
  recordId?: string;
  scanStatus?: "pending";
  notificationStatus?: "sent" | "failed" | "deferred" | "cancelled" | "missing";
};

export async function persistContactSubmission(
  db: DatabaseClient,
  sender: SubmissionNotificationSender,
  raw: RawContactSubmission,
  configuration: SubmissionRuntimeConfiguration,
  now = new Date(),
): Promise<SubmissionAcceptance> {
  const validated = validateContactSubmission(raw, configuration, now);
  if ("honeypot" in validated) return { accepted: true, duplicate: false };

  const [existing] = await db
    .select({ id: contactSubmissions.id })
    .from(contactSubmissions)
    .where(eq(contactSubmissions.idempotencyKeyHash, validated.submissionIdHash))
    .limit(1);
  if (existing) return { accepted: true, duplicate: true, recordId: existing.id };

  const created = await db.transaction(async (transaction) => {
    const [record] = await transaction
      .insert(contactSubmissions)
      .values({
        idempotencyKeyHash: validated.submissionIdHash,
        name: validated.name,
        company: validated.company,
        emailNormalized: validated.emailNormalized,
        phoneNormalized: validated.phoneNormalized,
        subject: validated.subject,
        message: validated.message,
        locale: validated.locale,
        privacyNoticeVersion: validated.privacyNoticeVersion,
        privacyNoticeShownAt: validated.privacyNoticeShownAt,
        privacyAcknowledgedAt: validated.privacyAcknowledgedAt,
        retentionDueAt: retentionDueAt(now, configuration.retentionDays),
      })
      .onConflictDoNothing({ target: contactSubmissions.idempotencyKeyHash })
      .returning({ id: contactSubmissions.id });
    if (!record) return undefined;
    const [notification] = await transaction
      .insert(submissionNotifications)
      .values({
        purpose: "contact",
        contactSubmissionId: record.id,
        locale: validated.locale,
        nextAttemptAt: now,
      })
      .returning({ id: submissionNotifications.id });
    await appendAuditEvent(transaction, {
      eventType: "privacy.contact_submitted",
      resourceType: "contact_submission",
      resourceId: record.id,
      metadata: { locale: validated.locale },
    });
    return { recordId: record.id, notificationId: notification!.id };
  });

  if (!created) {
    const [duplicate] = await db
      .select({ id: contactSubmissions.id })
      .from(contactSubmissions)
      .where(eq(contactSubmissions.idempotencyKeyHash, validated.submissionIdHash))
      .limit(1);
    return { accepted: true, duplicate: true, recordId: duplicate?.id };
  }

  const notificationStatus = await attemptSubmissionNotification(
    db,
    sender,
    created.notificationId,
    now,
  );
  return {
    accepted: true,
    duplicate: false,
    recordId: created.recordId,
    notificationStatus,
  };
}

async function compensateQuarantinedUpload(
  db: DatabaseClient,
  storage: CvObjectStorage,
  upload: { mediaId: string; storageKey: string },
  now: Date,
): Promise<void> {
  try {
    await storage.deleteQuarantine(upload.storageKey);
    await db.delete(media).where(eq(media.id, upload.mediaId));
  } catch {
    await db
      .update(media)
      .set({
        scanStatus: "error",
        scanCompletedAt: now,
        scanLastErrorCode: "ORPHAN_CLEANUP_REQUIRED",
        scanNextRetryAt: new Date(now.getTime() + 5 * 60_000),
      })
      .where(eq(media.id, upload.mediaId));
    securityLogger.error("security.cv_orphan_cleanup_required", {
      mediaId: upload.mediaId,
      errorCode: "ORPHAN_CLEANUP_REQUIRED",
    });
  }
}

export async function persistCareerSubmission(
  db: DatabaseClient,
  storage: CvObjectStorage,
  sender: SubmissionNotificationSender,
  raw: RawCareerSubmission,
  cv: { originalFilename: string; mimeType: string; bytes: Uint8Array },
  configuration: SubmissionRuntimeConfiguration,
  now = new Date(),
): Promise<SubmissionAcceptance> {
  const validated = validateCareerSubmission(raw, configuration, now);
  if ("honeypot" in validated) return { accepted: true, duplicate: false };
  validateCvUpload(cv);

  const options = await loadCareerFormOptions(db, validated.locale, now);
  const department = options.departments.find(({ id }) => id === validated.departmentId);
  const location = options.locations.find(({ key }) => key === validated.locationKey);
  const entityErrors: Record<string, "invalid"> = {};
  if (!department) entityErrors.departmentId = "invalid";
  if (!location) entityErrors.locationKey = "invalid";
  if (Object.keys(entityErrors).length > 0) {
    throw new PublicFormValidationError(entityErrors);
  }

  const [existing] = await db
    .select({ id: careerApplications.id })
    .from(careerApplications)
    .where(eq(careerApplications.idempotencyKeyHash, validated.submissionIdHash))
    .limit(1);
  if (existing) {
    return {
      accepted: true,
      duplicate: true,
      recordId: existing.id,
      scanStatus: "pending",
    };
  }

  const upload = await uploadCvToQuarantine(db, storage, cv);
  let created:
    | { recordId: string; notificationId: string }
    | undefined;
  try {
    created = await db.transaction(async (transaction) => {
      const [record] = await transaction
        .insert(careerApplications)
        .values({
          jobPostingId: null,
          idempotencyKeyHash: validated.submissionIdHash,
          firstName: validated.firstName,
          lastName: validated.lastName,
          phoneNormalized: validated.phoneNormalized,
          emailNormalized: validated.emailNormalized,
          gender: validated.gender,
          birthDate: validated.birthDate,
          maritalStatus: validated.maritalStatus,
          militaryStatus: validated.militaryStatus,
          defermentDate: validated.defermentDate,
          departmentId: department!.id,
          locationId: location!.id,
          knowsCompany: validated.knowsCompany,
          knowsCompanySource: validated.knowsCompanySource,
          expectedSalaryTry: validated.expectedSalaryTry,
          availableFrom: validated.availableFrom,
          aboutText: validated.aboutText,
          cvFileId: upload.mediaId,
          locale: validated.locale,
          privacyNoticeVersion: validated.privacyNoticeVersion,
          privacyNoticeShownAt: validated.privacyNoticeShownAt,
          privacyAcknowledgedAt: validated.privacyAcknowledgedAt,
          retentionDueAt: retentionDueAt(now, configuration.retentionDays),
        })
        .onConflictDoNothing({ target: careerApplications.idempotencyKeyHash })
        .returning({ id: careerApplications.id });
      if (!record) return undefined;
      const [notification] = await transaction
        .insert(submissionNotifications)
        .values({
          purpose: "career",
          careerApplicationId: record.id,
          locale: validated.locale,
          nextAttemptAt: now,
        })
        .returning({ id: submissionNotifications.id });
      await appendAuditEvent(transaction, {
        eventType: "privacy.career_application_submitted",
        resourceType: "career_application",
        resourceId: record.id,
        metadata: { locale: validated.locale, jobPostingId: null },
      });
      return { recordId: record.id, notificationId: notification!.id };
    });
  } catch (error) {
    await compensateQuarantinedUpload(db, storage, upload, now);
    throw error;
  }

  if (!created) {
    await compensateQuarantinedUpload(db, storage, upload, now);
    const [duplicate] = await db
      .select({ id: careerApplications.id })
      .from(careerApplications)
      .where(eq(careerApplications.idempotencyKeyHash, validated.submissionIdHash))
      .limit(1);
    return {
      accepted: true,
      duplicate: true,
      recordId: duplicate?.id,
      scanStatus: "pending",
    };
  }

  const notificationStatus = await attemptSubmissionNotification(
    db,
    sender,
    created.notificationId,
    now,
  );
  return {
    accepted: true,
    duplicate: false,
    recordId: created.recordId,
    scanStatus: "pending",
    notificationStatus,
  };
}

export async function cleanupOrphanedCareerUploads(
  db: DatabaseClient,
  storage: CvObjectStorage,
  options: { now?: Date; olderThanMinutes?: number; limit?: number } = {},
): Promise<number> {
  const now = options.now ?? new Date();
  const cutoff = new Date(
    now.getTime() - (options.olderThanMinutes ?? 30) * 60_000,
  );
  const orphaned = await db
    .select({ id: media.id, storageKey: media.storageKey })
    .from(media)
    .leftJoin(careerApplications, eq(careerApplications.cvFileId, media.id))
    .where(
      and(
        eq(media.storageClass, "quarantine"),
        isNull(careerApplications.id),
        lt(media.createdAt, cutoff),
      ),
    )
    .limit(Math.min(100, Math.max(1, options.limit ?? 25)));
  let cleaned = 0;
  for (const orphan of orphaned) {
    try {
      await storage.deleteQuarantine(orphan.storageKey);
      await db.delete(media).where(eq(media.id, orphan.id));
      cleaned += 1;
    } catch {
      securityLogger.error("security.cv_orphan_cleanup_failed", {
        mediaId: orphan.id,
        errorCode: "ORPHAN_CLEANUP_FAILED",
      });
    }
  }
  return cleaned;
}

