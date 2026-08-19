import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDatabase } from "../../src/db/client";
import { temporaryPrivacyNotices } from "../../src/content/temporary-legal-content";
import {
  careerApplications,
  contactSubmissions,
  media,
  submissionNotifications,
} from "../../src/db/schema";
import type { SubmissionRuntimeConfiguration } from "../../src/forms/configuration";
import {
  processDueSubmissionNotifications,
  type SubmissionNotificationMessage,
  type SubmissionNotificationSender,
} from "../../src/forms/notifications";
import {
  cleanupOrphanedCareerUploads,
  persistCareerSubmission,
  persistContactSubmission,
} from "../../src/forms/submissions";
import { resolvePublicCareerScanStatus } from "../../src/forms/status";
import { processGuardDutyScanEvent } from "../../src/security/cv/guardduty";
import type {
  CvObjectStorage,
  ProtectedCvObject,
} from "../../src/security/cv/storage";
import { uploadCvToQuarantine } from "../../src/security/cv/upload";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;
const validPdf = new TextEncoder().encode("%PDF-1.7\n1 0 obj\n%%EOF\n");

class TestStorage implements CvObjectStorage {
  quarantine = new Map<string, Uint8Array>();
  protected = new Map<string, Uint8Array>();
  puts = 0;

  async putQuarantine(key: string, bytes: Uint8Array): Promise<void> {
    this.puts += 1;
    this.quarantine.set(key, bytes);
  }

  async promoteToProtected(key: string): Promise<void> {
    const bytes = this.quarantine.get(key);
    if (!bytes) throw new Error("Missing quarantine object.");
    this.protected.set(key, bytes);
    this.quarantine.delete(key);
  }

  async readProtected(key: string): Promise<ProtectedCvObject> {
    const bytes = this.protected.get(key);
    if (!bytes) throw new Error("Missing protected object.");
    return { bytes, contentType: "application/pdf" };
  }

  async deleteQuarantine(key: string): Promise<void> {
    this.quarantine.delete(key);
  }

  async deleteProtected(key: string): Promise<void> {
    this.protected.delete(key);
  }

  async requeueQuarantine(oldKey: string, newKey: string): Promise<void> {
    const bytes = this.quarantine.get(oldKey);
    if (!bytes) throw new Error("Missing quarantine object.");
    this.quarantine.set(newKey, bytes);
    this.quarantine.delete(oldKey);
  }
}

class TestSender implements SubmissionNotificationSender {
  messages: SubmissionNotificationMessage[] = [];
  fail = false;

  async send(message: SubmissionNotificationMessage): Promise<void> {
    if (this.fail) {
      const error = new Error("Provider failure without PII.");
      error.name = "ProviderUnavailable";
      throw error;
    }
    this.messages.push(message);
  }
}

describeWithDatabase("Milestone 5 PostgreSQL submission persistence", () => {
  let database: ReturnType<typeof createDatabase>;
  let departmentId: string;
  const storage = new TestStorage();
  const createdCareerIds: string[] = [];
  const createdContactIds: string[] = [];
  const createdMediaIds: string[] = [];

  beforeAll(async () => {
    database = createDatabase(databaseUrl!);
    const department = await database.pool.query<{ id: string }>(
      "select id from department where key = 'sales'",
    );
    departmentId = department.rows[0]!.id;
  });

  afterAll(async () => {
    if (createdCareerIds.length > 0) {
      await database.pool.query(
        "delete from career_application where id = any($1::uuid[])",
        [createdCareerIds],
      );
    }
    if (createdContactIds.length > 0) {
      await database.pool.query(
        "delete from contact_submission where id = any($1::uuid[])",
        [createdContactIds],
      );
    }
    if (createdMediaIds.length > 0) {
      await database.pool.query("delete from media where id = any($1::uuid[])", [
        createdMediaIds,
      ]);
    }
    await database.pool.end();
  });

  function configuration(version = "test-v1"): SubmissionRuntimeConfiguration {
    return {
      locale: "tr",
      retentionDays: 30,
      privacyNoticeVersion: version,
      privacyNotice: {
        ...temporaryPrivacyNotices.contact.tr,
        legal_version: version,
      },
      privacyAcknowledgementRequired: true,
      approvalGatedCareerFieldsEnabled: false,
    };
  }

  function contactRaw(now: Date, submissionId = randomUUID(), version = "test-v1") {
    return {
      submissionId,
      locale: "tr",
      name: "Test İletişim",
      company: "Test Firma",
      email: "CONTACT@EXAMPLE.TEST",
      phone: "+90 (555) 111 22 33",
      subject: `Milestone 5 ${submissionId}`,
      message: "Bu kayıt persistence ve notification dayanıklılık testi içindir.",
      privacyNoticeVersion: version,
      privacyNoticeShownAt: new Date(now.getTime() - 60_000).toISOString(),
      privacyAcknowledged: true,
    };
  }

  function careerRaw(now: Date, submissionId = randomUUID()) {
    return {
      submissionId,
      locale: "tr",
      firstName: "Test",
      lastName: "Aday",
      phone: "+90 (555) 111 22 33",
      email: "CANDIDATE@EXAMPLE.TEST",
      departmentId,
      locationKey: "istanbul",
      expectedSalaryTry: "50000",
      availableFrom: "2026-09-01",
      aboutText: "Otomotiv dağıtım operasyonlarında çalışma deneyimim bulunuyor.",
      knowsCompany: "no",
      privacyNoticeVersion: "test-v1",
      privacyNoticeShownAt: new Date(now.getTime() - 60_000).toISOString(),
      privacyAcknowledged: true,
    };
  }

  const cv = () => ({
    originalFilename: "candidate.pdf",
    mimeType: "application/pdf",
    bytes: validPdf,
  });

  it("persists contact before notification and retains it when the provider fails", async () => {
    const now = new Date();
    const sender = new TestSender();
    sender.fail = true;
    const result = await persistContactSubmission(
      database.db,
      sender,
      contactRaw(now),
      configuration(),
      now,
    );
    createdContactIds.push(result.recordId!);
    expect(result.notificationStatus).toBe("failed");

    const [record] = await database.db
      .select()
      .from(contactSubmissions)
      .where(eq(contactSubmissions.id, result.recordId!));
    expect(record).toMatchObject({
      emailNormalized: "contact@example.test",
      phoneNormalized: "+905551112233",
      locale: "tr",
      privacyNoticeVersion: "test-v1",
    });
    const [notification] = await database.db
      .select()
      .from(submissionNotifications)
      .where(eq(submissionNotifications.contactSubmissionId, result.recordId!));
    expect(notification).toMatchObject({
      status: "failed",
      attemptCount: 1,
      lastErrorCode: "ProviderUnavailable",
    });
  });

  it("prevents contact double-submit without blocking a new submission ID", async () => {
    const now = new Date();
    const sender = new TestSender();
    const submissionId = randomUUID();
    const first = await persistContactSubmission(
      database.db,
      sender,
      contactRaw(now, submissionId),
      configuration(),
      now,
    );
    createdContactIds.push(first.recordId!);
    const duplicate = await persistContactSubmission(
      database.db,
      sender,
      contactRaw(now, submissionId),
      configuration(),
      now,
    );
    expect(duplicate).toMatchObject({ duplicate: true, recordId: first.recordId });

    const second = await persistContactSubmission(
      database.db,
      sender,
      contactRaw(now, randomUUID()),
      configuration(),
      now,
    );
    createdContactIds.push(second.recordId!);
    expect(second.duplicate).toBe(false);
  });

  it("keeps the notice version shown to an earlier submission after a new version is introduced", async () => {
    const now = new Date();
    const sender = new TestSender();
    const first = await persistContactSubmission(
      database.db,
      sender,
      contactRaw(now, randomUUID(), "TEMP-2026-08-V1"),
      configuration("TEMP-2026-08-V1"),
      now,
    );
    createdContactIds.push(first.recordId!);
    const second = await persistContactSubmission(
      database.db,
      sender,
      contactRaw(now, randomUUID(), "LEGAL-2026-09-V1"),
      configuration("LEGAL-2026-09-V1"),
      now,
    );
    createdContactIds.push(second.recordId!);
    const stored = await database.db
      .select({ id: contactSubmissions.id, version: contactSubmissions.privacyNoticeVersion })
      .from(contactSubmissions)
      .where(inArray(contactSubmissions.id, [first.recordId!, second.recordId!]));
    expect(stored).toEqual(expect.arrayContaining([
      { id: first.recordId, version: "TEMP-2026-08-V1" },
      { id: second.recordId, version: "LEGAL-2026-09-V1" },
    ]));
  });

  it("persists a null-job general application with quarantined pending CV metadata", async () => {
    const now = new Date();
    const sender = new TestSender();
    const submissionId = randomUUID();
    const putsBefore = storage.puts;
    const result = await persistCareerSubmission(
      database.db,
      storage,
      sender,
      careerRaw(now, submissionId),
      cv(),
      configuration(),
      now,
    );
    createdCareerIds.push(result.recordId!);
    const [record] = await database.db
      .select({
        jobPostingId: careerApplications.jobPostingId,
        cvFileId: careerApplications.cvFileId,
        locale: careerApplications.locale,
        privacyNoticeVersion: careerApplications.privacyNoticeVersion,
      })
      .from(careerApplications)
      .where(eq(careerApplications.id, result.recordId!));
    createdMediaIds.push(record!.cvFileId!);
    expect(record).toMatchObject({
      jobPostingId: null,
      locale: "tr",
      privacyNoticeVersion: "test-v1",
    });
    const [file] = await database.db
      .select({ storageClass: media.storageClass, scanStatus: media.scanStatus })
      .from(media)
      .where(eq(media.id, record!.cvFileId!));
    expect(file).toEqual({ storageClass: "quarantine", scanStatus: "pending" });
    expect(result.notificationStatus).toBe("deferred");
    expect(await resolvePublicCareerScanStatus(database.db, submissionId)).toBe(
      "processing",
    );

    const duplicate = await persistCareerSubmission(
      database.db,
      storage,
      sender,
      careerRaw(now, submissionId),
      cv(),
      configuration(),
      now,
    );
    expect(duplicate).toMatchObject({ duplicate: true, recordId: result.recordId });
    expect(storage.puts - putsBefore).toBe(1);
  });

  it("promotes only a clean scan and sends the record-ID-only HR notification", async () => {
    const now = new Date();
    const sender = new TestSender();
    const submissionId = randomUUID();
    const result = await persistCareerSubmission(
      database.db,
      storage,
      sender,
      careerRaw(now, submissionId),
      cv(),
      configuration(),
      now,
    );
    createdCareerIds.push(result.recordId!);
    const [record] = await database.db
      .select({ cvFileId: careerApplications.cvFileId })
      .from(careerApplications)
      .where(eq(careerApplications.id, result.recordId!));
    createdMediaIds.push(record!.cvFileId!);
    const [file] = await database.db
      .select({ storageKey: media.storageKey })
      .from(media)
      .where(eq(media.id, record!.cvFileId!));

    expect(
      await processGuardDutyScanEvent(
        database.db,
        storage,
        {
          eventId: randomUUID(),
          bucketName: "quarantine-test",
          objectKey: file!.storageKey,
          result: "NO_THREATS_FOUND",
        },
        { expectedQuarantineBucket: "quarantine-test", now },
      ),
    ).toBe("processed");
    const delivery = await processDueSubmissionNotifications(database.db, sender, {
      now: new Date(now.getTime() + 6 * 60_000),
    });
    expect(delivery.sent).toBeGreaterThanOrEqual(1);
    expect(sender.messages.some(({ resourceId }) => resourceId === result.recordId)).toBe(true);
    expect(JSON.stringify(sender.messages)).not.toContain("candidate@example.test");
    expect(await resolvePublicCareerScanStatus(database.db, submissionId)).toBe("clean");
  });

  it("keeps infected CVs quarantined and cancels their HR notification", async () => {
    const now = new Date();
    const sender = new TestSender();
    const submissionId = randomUUID();
    const result = await persistCareerSubmission(
      database.db,
      storage,
      sender,
      careerRaw(now, submissionId),
      cv(),
      configuration(),
      now,
    );
    createdCareerIds.push(result.recordId!);
    const [record] = await database.db
      .select({ cvFileId: careerApplications.cvFileId })
      .from(careerApplications)
      .where(eq(careerApplications.id, result.recordId!));
    createdMediaIds.push(record!.cvFileId!);
    const [file] = await database.db
      .select({ storageKey: media.storageKey })
      .from(media)
      .where(eq(media.id, record!.cvFileId!));
    await processGuardDutyScanEvent(
      database.db,
      storage,
      {
        eventId: randomUUID(),
        bucketName: "quarantine-test",
        objectKey: file!.storageKey,
        result: "THREATS_FOUND",
      },
      { expectedQuarantineBucket: "quarantine-test", now, alert: () => undefined },
    );
    await processDueSubmissionNotifications(database.db, sender, {
      now: new Date(now.getTime() + 6 * 60_000),
    });
    const [updatedFile] = await database.db
      .select({ storageClass: media.storageClass, scanStatus: media.scanStatus })
      .from(media)
      .where(eq(media.id, record!.cvFileId!));
    const [notification] = await database.db
      .select({ status: submissionNotifications.status })
      .from(submissionNotifications)
      .where(eq(submissionNotifications.careerApplicationId, result.recordId!));
    expect(updatedFile).toEqual({ storageClass: "quarantine", scanStatus: "infected" });
    expect(notification?.status).toBe("cancelled");
    expect(sender.messages.some(({ resourceId }) => resourceId === result.recordId)).toBe(false);
    expect(await resolvePublicCareerScanStatus(database.db, submissionId)).toBe(
      "infected",
    );
  });

  it("cleans an unattached quarantine object and its metadata", async () => {
    const now = new Date();
    const upload = await uploadCvToQuarantine(database.db, storage, cv());
    createdMediaIds.push(upload.mediaId);
    expect(
      await cleanupOrphanedCareerUploads(database.db, storage, {
        now: new Date(now.getTime() + 31 * 60_000),
        olderThanMinutes: 30,
      }),
    ).toBeGreaterThanOrEqual(1);
    const rows = await database.db
      .select({ id: media.id })
      .from(media)
      .where(inArray(media.id, [upload.mediaId]));
    expect(rows).toHaveLength(0);
  });
});
