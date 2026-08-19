import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
import { and, eq, inArray, lte, ne } from "drizzle-orm";

import type { DatabaseClient } from "@/db/client";
import {
  careerApplications,
  media,
  submissionNotifications,
} from "@/db/schema";
import type { Locale } from "@/i18n/config";
import { securityLogger } from "@/security/logging";

import {
  resolveNotificationRecipient,
  type PublicFormKind,
} from "./configuration";
import { normalizeEmail } from "./validation";

export type SubmissionNotificationMessage = {
  notificationId: string;
  purpose: PublicFormKind;
  resourceId: string;
  locale: Locale;
};

export interface SubmissionNotificationSender {
  send(message: SubmissionNotificationMessage): Promise<void>;
}

export class UnavailableSubmissionNotificationSender
  implements SubmissionNotificationSender
{
  async send(): Promise<void> {
    const error = new Error("Notification provider is unavailable.");
    error.name = "NotificationProviderUnavailable";
    throw error;
  }
}

export class SesSubmissionNotificationSender
  implements SubmissionNotificationSender
{
  private readonly client: SESv2Client;

  constructor(
    region: string,
    private readonly sender: string,
    private readonly recipients: Partial<Record<PublicFormKind, string>>,
  ) {
    this.client = new SESv2Client({ region });
  }

  async send(message: SubmissionNotificationMessage): Promise<void> {
    const recipient = this.recipients[message.purpose];
    if (!recipient) throw new Error("NotificationRecipientUnavailable");
    const subject =
      message.purpose === "career"
        ? "Ardaş · New career application"
        : "Ardaş · New contact submission";
    const body = [
      "A new form record is available in the Ardaş administration system.",
      `Type: ${message.purpose}`,
      `Record ID: ${message.resourceId}`,
      `Locale: ${message.locale}`,
      "Personal data is intentionally excluded from this notification.",
    ].join("\n");
    await this.client.send(
      new SendEmailCommand({
        FromEmailAddress: this.sender,
        Destination: { ToAddresses: [recipient] },
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: "UTF-8" },
            Body: { Text: { Data: body, Charset: "UTF-8" } },
          },
        },
      }),
    );
  }
}

export async function createSesNotificationSender(
  db: DatabaseClient,
  environment: NodeJS.ProcessEnv = process.env,
): Promise<SesSubmissionNotificationSender> {
  const region = environment.SES_REGION ?? environment.AWS_REGION;
  const sender = normalizeEmail(environment.EMAIL_SENDER);
  const [careerRecipientValue, contactRecipientValue] = await Promise.all([
    resolveNotificationRecipient(db, "career", environment),
    resolveNotificationRecipient(db, "contact", environment),
  ]);
  const careerRecipient = normalizeEmail(careerRecipientValue);
  const contactRecipient = normalizeEmail(contactRecipientValue);
  if (!region || !sender || (!careerRecipient && !contactRecipient)) {
    throw new Error("SES notification configuration is incomplete.");
  }
  return new SesSubmissionNotificationSender(region, sender, {
    ...(careerRecipient ? { career: careerRecipient } : {}),
    ...(contactRecipient ? { contact: contactRecipient } : {}),
  });
}

function retryAt(now: Date, attempts: number): Date {
  const delayMinutes = Math.min(60, 5 * 2 ** Math.max(0, attempts - 1));
  return new Date(now.getTime() + delayMinutes * 60_000);
}

function safeErrorCode(error: unknown): string {
  if (error instanceof Error && /^[A-Za-z0-9_.-]{1,120}$/.test(error.name)) {
    return error.name;
  }
  return "NOTIFICATION_PROVIDER_ERROR";
}

async function careerCvDeliveryState(
  db: DatabaseClient,
  applicationId: string,
): Promise<"clean" | "pending" | "infected" | "missing"> {
  const [row] = await db
    .select({ storageClass: media.storageClass, scanStatus: media.scanStatus })
    .from(careerApplications)
    .innerJoin(media, eq(media.id, careerApplications.cvFileId))
    .where(eq(careerApplications.id, applicationId))
    .limit(1);
  if (!row) return "missing";
  if (row.scanStatus === "infected") return "infected";
  return row.storageClass === "protected" && row.scanStatus === "clean"
    ? "clean"
    : "pending";
}

export async function attemptSubmissionNotification(
  db: DatabaseClient,
  sender: SubmissionNotificationSender,
  notificationId: string,
  now = new Date(),
): Promise<"sent" | "failed" | "deferred" | "cancelled" | "missing"> {
  const [notification] = await db
    .select({
      id: submissionNotifications.id,
      purpose: submissionNotifications.purpose,
      careerApplicationId: submissionNotifications.careerApplicationId,
      contactSubmissionId: submissionNotifications.contactSubmissionId,
      locale: submissionNotifications.locale,
      status: submissionNotifications.status,
      attemptCount: submissionNotifications.attemptCount,
    })
    .from(submissionNotifications)
    .where(eq(submissionNotifications.id, notificationId))
    .limit(1);
  if (!notification || notification.status === "sent" || notification.status === "cancelled") {
    return notification?.status === "sent" ? "sent" : notification?.status === "cancelled" ? "cancelled" : "missing";
  }

  const resourceId =
    notification.purpose === "career"
      ? notification.careerApplicationId
      : notification.contactSubmissionId;
  if (!resourceId) return "missing";

  if (notification.purpose === "career") {
    const cvState = await careerCvDeliveryState(db, resourceId);
    if (cvState === "pending") {
      await db
        .update(submissionNotifications)
        .set({ nextAttemptAt: new Date(now.getTime() + 5 * 60_000), updatedAt: now })
        .where(eq(submissionNotifications.id, notification.id));
      return "deferred";
    }
    if (cvState === "infected" || cvState === "missing") {
      await db
        .update(submissionNotifications)
        .set({
          status: "cancelled",
          lastErrorCode: cvState === "infected" ? "CV_INFECTED" : "CV_MISSING",
          updatedAt: now,
        })
        .where(eq(submissionNotifications.id, notification.id));
      return "cancelled";
    }
  }

  try {
    await sender.send({
      notificationId: notification.id,
      purpose: notification.purpose,
      resourceId,
      locale: notification.locale,
    });
    await db
      .update(submissionNotifications)
      .set({
        status: "sent",
        attemptCount: notification.attemptCount + 1,
        lastErrorCode: null,
        sentAt: now,
        updatedAt: now,
      })
      .where(eq(submissionNotifications.id, notification.id));
    return "sent";
  } catch (error) {
    const errorCode = safeErrorCode(error);
    await db
      .update(submissionNotifications)
      .set({
        status: "failed",
        attemptCount: notification.attemptCount + 1,
        lastErrorCode: errorCode,
        nextAttemptAt: retryAt(now, notification.attemptCount + 1),
        updatedAt: now,
      })
      .where(eq(submissionNotifications.id, notification.id));
    securityLogger.error("operations.submission_notification_failed", {
      notificationId: notification.id,
      resourceId,
      purpose: notification.purpose,
      errorCode,
    });
    return "failed";
  }
}

export async function processDueSubmissionNotifications(
  db: DatabaseClient,
  sender: SubmissionNotificationSender,
  options: { now?: Date; limit?: number } = {},
) {
  const now = options.now ?? new Date();
  const due = await db
    .select({ id: submissionNotifications.id })
    .from(submissionNotifications)
    .where(
      and(
        inArray(submissionNotifications.status, ["pending", "failed"]),
        ne(submissionNotifications.status, "cancelled"),
        lte(submissionNotifications.nextAttemptAt, now),
      ),
    )
    .limit(Math.min(100, Math.max(1, options.limit ?? 25)));
  const results = { sent: 0, failed: 0, deferred: 0, cancelled: 0 };
  for (const { id } of due) {
    const result = await attemptSubmissionNotification(db, sender, id, now);
    if (result in results) results[result as keyof typeof results] += 1;
  }
  return results;
}
