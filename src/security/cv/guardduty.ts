import { and, eq, lt, lte } from "drizzle-orm";

import type { DatabaseClient } from "../../db/client";
import { malwareScanEvents, media } from "../../db/schema";
import { securityLogger } from "../logging";
import type { CvObjectStorage } from "./storage";
import { createCvStorageKey } from "./validation";

export const guardDutyResults = [
  "NO_THREATS_FOUND",
  "THREATS_FOUND",
  "UNSUPPORTED",
  "ACCESS_DENIED",
  "FAILED",
] as const;

export type GuardDutyResult = (typeof guardDutyResults)[number];

export interface GuardDutyScanEvent {
  eventId: string;
  bucketName: string;
  objectKey: string;
  result: GuardDutyResult;
  statusReason?: string;
}

export interface CvScanAlert {
  mediaId: string;
  code: string;
}

export type CvScanAlertSink = (alert: CvScanAlert) => Promise<void> | void;

const defaultAlertSink: CvScanAlertSink = (alert) => {
  securityLogger.error("security.cv_scan_alert", alert);
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isGuardDutyResult(value: unknown): value is GuardDutyResult {
  return (
    typeof value === "string" &&
    guardDutyResults.some((result) => result === value)
  );
}

export function parseGuardDutyScanEvent(value: unknown): GuardDutyScanEvent {
  if (!isRecord(value) || value.source !== "aws.guardduty") {
    throw new Error("Invalid GuardDuty event source.");
  }
  if (value["detail-type"] !== "GuardDuty Malware Protection Object Scan Result") {
    throw new Error("Invalid GuardDuty event type.");
  }
  const detail = value.detail;
  if (!isRecord(detail) || detail.resourceType !== "S3_OBJECT") {
    throw new Error("Invalid GuardDuty event detail.");
  }
  const object = detail.s3ObjectDetails;
  const scan = detail.scanResultDetails;
  if (!isRecord(object) || !isRecord(scan)) {
    throw new Error("Invalid GuardDuty object scan details.");
  }
  const eventId = value.id;
  const bucketName = object.bucketName;
  const objectKey = object.objectKey;
  const result = scan.scanResultStatus;
  if (
    typeof eventId !== "string" ||
    typeof bucketName !== "string" ||
    typeof objectKey !== "string" ||
    !isGuardDutyResult(result)
  ) {
    throw new Error("Incomplete GuardDuty event.");
  }
  const reasons = scan.statusReasons;
  const statusReason =
    Array.isArray(reasons) && typeof reasons[0] === "string"
      ? reasons[0].slice(0, 120)
      : undefined;

  return { eventId, bucketName, objectKey, result, statusReason };
}

function retryAt(now: Date, attemptCount: number): Date {
  const delayMinutes = Math.min(60, 5 * 2 ** Math.max(0, attemptCount - 1));
  return new Date(now.getTime() + delayMinutes * 60_000);
}

export async function processGuardDutyScanEvent(
  db: DatabaseClient,
  storage: CvObjectStorage,
  event: GuardDutyScanEvent,
  options: {
    expectedQuarantineBucket: string;
    alert?: CvScanAlertSink;
    now?: Date;
  },
): Promise<"processed" | "duplicate" | "ignored" | "failed_closed"> {
  if (event.bucketName !== options.expectedQuarantineBucket) {
    throw new Error("GuardDuty event bucket does not match quarantine storage.");
  }
  const alert = options.alert ?? defaultAlertSink;
  const now = options.now ?? new Date();
  const [file] = await db
    .select({
      id: media.id,
      storageClass: media.storageClass,
      scanStatus: media.scanStatus,
      scanAttemptCount: media.scanAttemptCount,
    })
    .from(media)
    .where(eq(media.storageKey, event.objectKey))
    .limit(1);

  if (!file) {
    securityLogger.warn("security.guardduty_object_not_registered", {
      eventId: event.eventId,
    });
    return "ignored";
  }
  if (file.storageClass === "protected" && file.scanStatus === "clean") {
    return "duplicate";
  }

  const inserted = await db
    .insert(malwareScanEvents)
    .values({
      providerEventId: event.eventId,
      mediaId: file.id,
      result: event.result,
    })
    .onConflictDoNothing({ target: malwareScanEvents.providerEventId })
    .returning({ id: malwareScanEvents.id });
  if (inserted.length === 0) {
    return "duplicate";
  }

  if (event.result === "NO_THREATS_FOUND") {
    try {
      await storage.promoteToProtected(event.objectKey);
      await db
        .update(media)
        .set({
          storageClass: "protected",
          scanStatus: "clean",
          scanCompletedAt: now,
          scanLastResult: event.result,
          scanLastErrorCode: null,
          scanNextRetryAt: null,
        })
        .where(eq(media.id, file.id));
      return "processed";
    } catch {
      await storage.deleteProtected(event.objectKey).catch(() => undefined);
      await db
        .update(media)
        .set({
          scanStatus: "error",
          scanCompletedAt: now,
          scanLastResult: event.result,
          scanLastErrorCode: "PROTECTED_PROMOTION_FAILED",
          scanNextRetryAt: retryAt(now, file.scanAttemptCount),
        })
        .where(eq(media.id, file.id));
      await alert({ mediaId: file.id, code: "PROTECTED_PROMOTION_FAILED" });
      return "failed_closed";
    }
  }

  if (event.result === "THREATS_FOUND") {
    await db
      .update(media)
      .set({
        scanStatus: "infected",
        scanCompletedAt: now,
        scanLastResult: event.result,
        scanLastErrorCode: null,
        scanNextRetryAt: null,
      })
      .where(eq(media.id, file.id));
    await alert({ mediaId: file.id, code: "MALWARE_DETECTED" });
    return "processed";
  }

  const errorCode = event.statusReason ?? event.result;
  await db
    .update(media)
    .set({
      scanStatus: "error",
      scanCompletedAt: now,
      scanLastResult: event.result,
      scanLastErrorCode: errorCode,
      scanNextRetryAt: retryAt(now, file.scanAttemptCount),
    })
    .where(eq(media.id, file.id));
  await alert({ mediaId: file.id, code: errorCode });
  return "failed_closed";
}

export async function markTimedOutCvScans(
  db: DatabaseClient,
  options: {
    alert?: CvScanAlertSink;
    now?: Date;
    timeoutMinutes?: number;
  } = {},
): Promise<number> {
  const now = options.now ?? new Date();
  const cutoff = new Date(
    now.getTime() - (options.timeoutMinutes ?? 15) * 60_000,
  );
  const timedOut = await db
    .update(media)
    .set({
      scanStatus: "error",
      scanCompletedAt: now,
      scanLastErrorCode: "SCAN_TIMEOUT",
      scanNextRetryAt: new Date(now.getTime() + 5 * 60_000),
    })
    .where(
      and(
        eq(media.storageClass, "quarantine"),
        eq(media.scanStatus, "pending"),
        lt(media.scanRequestedAt, cutoff),
      ),
    )
    .returning({ id: media.id });
  const alert = options.alert ?? defaultAlertSink;
  await Promise.all(
    timedOut.map(({ id }) => alert({ mediaId: id, code: "SCAN_TIMEOUT" })),
  );
  return timedOut.length;
}

export async function retryDueCvScans(
  db: DatabaseClient,
  storage: CvObjectStorage,
  options: { alert?: CvScanAlertSink; now?: Date; limit?: number } = {},
): Promise<number> {
  const now = options.now ?? new Date();
  const due = await db
    .select({
      id: media.id,
      storageKey: media.storageKey,
      scanAttemptCount: media.scanAttemptCount,
    })
    .from(media)
    .where(
      and(
        eq(media.storageClass, "quarantine"),
        eq(media.scanStatus, "error"),
        lte(media.scanNextRetryAt, now),
        lt(media.scanAttemptCount, 3),
      ),
    )
    .limit(options.limit ?? 10);
  const alert = options.alert ?? defaultAlertSink;
  let retried = 0;

  for (const file of due) {
    const newKey = createCvStorageKey(now);
    try {
      await storage.requeueQuarantine(file.storageKey, newKey);
      await db
        .update(media)
        .set({
          storageKey: newKey,
          scanStatus: "pending",
          scanAttemptCount: file.scanAttemptCount + 1,
          scanRequestedAt: now,
          scanCompletedAt: null,
          scanLastResult: null,
          scanLastErrorCode: null,
          scanNextRetryAt: null,
        })
        .where(eq(media.id, file.id));
      retried += 1;
    } catch {
      await alert({ mediaId: file.id, code: "SCAN_RETRY_FAILED" });
    }
  }
  return retried;
}
