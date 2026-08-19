import { and, eq } from "drizzle-orm";

import { parsePublicPageContent } from "@/content/public-pages";
import {
  privacyNoticeCanEnableProduction,
  readPrivacyNotice,
  type PrivacyNoticeContent,
} from "@/content/legal-content";
import { temporaryPrivacyNotices } from "@/content/temporary-legal-content";
import { isPubliclyAvailable } from "@/content/publication";
import type { DatabaseClient } from "@/db/client";
import { pageLocales, pages, siteSettings } from "@/db/schema";
import type { Locale } from "@/i18n/config";
import { routeDefinitions } from "@/i18n/routes";
import { developmentContentIsEnabled } from "@/content/development-content";
import { hasCompleteAuth0Configuration } from "@/auth/auth0";
import { resolveRetentionDays } from "@/security/privacy-retention";

import type { PublicFormConfiguration } from "./contracts";

export type PublicFormKind = "career" | "contact";

export type SubmissionRuntimeConfiguration = PublicFormConfiguration & {
  retentionDays: number;
};

type FormEnvironment = NodeJS.ProcessEnv;

function enabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

function nonEmpty(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

async function resolvePublishedPrivacyNotice(
  db: DatabaseClient,
  kind: PublicFormKind,
  locale: Locale,
  now: Date,
): Promise<PrivacyNoticeContent | undefined> {
  const routeKey = kind === "career" ? "career-apply" : "contact";
  const [row] = await db
    .select({
      title: pageLocales.title,
      content: pageLocales.contentJson,
      locale: pageLocales.locale,
      slug: pageLocales.slug,
      publishStatus: pageLocales.publishStatus,
      publishedAt: pageLocales.publishedAt,
      scheduledArchiveAt: pageLocales.scheduledArchiveAt,
    })
    .from(pages)
    .innerJoin(pageLocales, eq(pageLocales.pageId, pages.id))
    .where(and(eq(pages.routeKey, routeKey), eq(pageLocales.locale, locale)))
    .limit(1);
  if (
    !row ||
    row.slug !== routeDefinitions[routeKey][locale] ||
    !isPubliclyAvailable(row, now)
  ) return undefined;
  return readPrivacyNotice(
    parsePublicPageContent(row.content, row.title).privacyNotice,
  );
}

async function settingString(
  db: DatabaseClient,
  key: "contact_notification_recipient" | "hr_notification_recipient",
): Promise<string | undefined> {
  const [setting] = await db
    .select({ value: siteSettings.typedValue })
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);
  return typeof setting?.value === "string" ? nonEmpty(setting.value) : undefined;
}

export async function resolveNotificationRecipient(
  db: DatabaseClient,
  kind: PublicFormKind,
  environment: FormEnvironment = process.env,
): Promise<string | undefined> {
  const settingKey =
    kind === "career" ? "hr_notification_recipient" : "contact_notification_recipient";
  const environmentValue =
    kind === "career"
      ? environment.HR_NOTIFICATION_RECIPIENT
      : environment.CONTACT_NOTIFICATION_RECIPIENT;
  return (await settingString(db, settingKey)) ?? nonEmpty(environmentValue);
}

export async function resolveSubmissionRuntimeConfiguration(
  db: DatabaseClient,
  kind: PublicFormKind,
  locale: Locale,
  environment: FormEnvironment = process.env,
): Promise<SubmissionRuntimeConfiguration | undefined> {
  const now = new Date();
  const development = developmentContentIsEnabled(environment);
  const featureEnabled =
    kind === "career"
      ? enabled(environment.PUBLIC_CAREER_FORM_ENABLED)
      : enabled(environment.PUBLIC_CONTACT_FORM_ENABLED);
  if (!development && !featureEnabled) return undefined;

  const retentionDays = await resolveRetentionDays(
    db,
    kind === "career" ? "candidate_retention_days" : "contact_retention_days",
    kind === "career"
      ? environment.CANDIDATE_RETENTION_DAYS
      : environment.CONTACT_RETENTION_DAYS,
  );
  if (!retentionDays) return undefined;

  const publishedNotice = await resolvePublishedPrivacyNotice(
    db,
    kind,
    locale,
    now,
  );
  const privacyNotice = publishedNotice ??
    (development ? temporaryPrivacyNotices[kind][locale] : undefined);
  if (!privacyNotice) {
    return undefined;
  }
  const configuredNoticeVersion = nonEmpty(
    kind === "career"
      ? environment.CAREER_PRIVACY_NOTICE_VERSION ?? environment.FORM_PRIVACY_NOTICE_VERSION
      : environment.CONTACT_PRIVACY_NOTICE_VERSION ?? environment.FORM_PRIVACY_NOTICE_VERSION,
  );
  if (!development && configuredNoticeVersion !== privacyNotice.legal_version) {
    return undefined;
  }
  if (
    environment.APP_ENV === "production" &&
    !privacyNoticeCanEnableProduction(privacyNotice)
  ) {
    return undefined;
  }

  if (!nonEmpty(environment.RATE_LIMIT_HASH_SECRET)) return undefined;

  if (!development) {
    const recipient = await resolveNotificationRecipient(db, kind, environment);
    if (
      !recipient ||
      !nonEmpty(environment.EMAIL_SENDER) ||
      !nonEmpty(environment.SES_REGION ?? environment.AWS_REGION) ||
      !nonEmpty(environment.CRON_SECRET)
    ) {
      return undefined;
    }

    if (
      kind === "career" &&
      (!hasCompleteAuth0Configuration(environment) ||
        !nonEmpty(environment.AWS_REGION) ||
        !nonEmpty(environment.S3_QUARANTINE_BUCKET) ||
        !nonEmpty(environment.S3_PROTECTED_BUCKET) ||
        !nonEmpty(environment.S3_GUARDDUTY_SCAN_QUEUE_URL))
    ) {
      return undefined;
    }
  }

  return {
    locale,
    retentionDays,
    privacyNoticeVersion: privacyNotice.legal_version,
    privacyNotice,
    privacyAcknowledgementRequired: true,
    approvalGatedCareerFieldsEnabled:
      kind === "career" && enabled(environment.CAREER_APPROVAL_GATED_FIELDS_ENABLED),
  };
}
