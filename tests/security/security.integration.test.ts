import { randomUUID } from "node:crypto";

import type { SessionData } from "@auth0/nextjs-auth0/types";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { recordAuth0Login } from "../../src/auth/login-events";
import { createDatabase } from "../../src/db/client";
import { media } from "../../src/db/schema";
import {
  assignRole,
  recordMfaSecurityChange,
  updateCandidateStatus,
} from "../../src/security/admin-mutations";
import {
  processGuardDutyScanEvent,
  markTimedOutCvScans,
} from "../../src/security/cv/guardduty";
import { downloadProtectedCv } from "../../src/security/cv/download";
import type {
  CvObjectStorage,
  ProtectedCvObject,
} from "../../src/security/cv/storage";
import { updateDealerPortalUrl } from "../../src/security/dealer-portal";
import { enforceRateLimit } from "../../src/security/rate-limit";
import {
  anonymizeCandidate,
  deleteCandidate,
} from "../../src/security/privacy-retention";
import {
  permissionKeys,
  rolePermissionGrants,
  type RoleKey,
} from "../../src/security/rbac/catalog";
import {
  createPermissions,
  type AdminPrincipal,
} from "../../src/security/rbac/authorization";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

class FakeCvStorage implements CvObjectStorage {
  promoted: string[] = [];
  protectedReads: string[] = [];
  failPromotion = false;

  async putQuarantine(): Promise<void> {}

  async promoteToProtected(key: string): Promise<void> {
    if (this.failPromotion) {
      throw new Error("storage unavailable");
    }
    this.promoted.push(key);
  }

  async readProtected(key: string): Promise<ProtectedCvObject> {
    this.protectedReads.push(key);
    return {
      bytes: new TextEncoder().encode("%PDF-1.7\n%%EOF"),
      contentType: "application/pdf",
    };
  }

  async deleteQuarantine(): Promise<void> {}

  async deleteProtected(): Promise<void> {}

  async requeueQuarantine(): Promise<void> {}
}

describeWithDatabase("Milestone 2 PostgreSQL security boundaries", () => {
  const prefix = `m2-${randomUUID()}`;
  const departmentId = randomUUID();
  const locationId = randomUUID();
  const adminUserId = randomUUID();
  const targetUserId = randomUUID();
  const createdMediaIds: string[] = [];
  let database: ReturnType<typeof createDatabase>;

  const principal = (
    role: RoleKey,
    mfaAuthenticated = true,
    userId = adminUserId,
  ): AdminPrincipal => ({
    userId,
    auth0Subject: `auth0|${userId}`,
    mfaAuthenticated,
    permissions: createPermissions(rolePermissionGrants[role]),
  });

  beforeAll(async () => {
    database = createDatabase(databaseUrl!);
    await database.pool.query(
      `insert into department (id, key, sort_order, status)
       values ($1, $2, 0, 'active')`,
      [departmentId, `${prefix}-department`],
    );
    await database.pool.query(
      `insert into location (id, key, sort_order, status)
       values ($1, $2, 0, 'active')`,
      [locationId, `${prefix}-location`],
    );
    await database.pool.query(
      `insert into admin_user
        (id, auth0_subject, email, display_name, status)
       values
        ($1, $2, $3, 'Security Test Admin', 'active'),
        ($4, $5, $6, 'Security Test Target', 'active')`,
      [
        adminUserId,
        `auth0|${adminUserId}`,
        `${adminUserId}@example.test`,
        targetUserId,
        `auth0|${targetUserId}`,
        `${targetUserId}@example.test`,
      ],
    );
  });

  afterAll(async () => {
    await database.pool.query(
      "delete from career_application where department_id = $1",
      [departmentId],
    );
    if (createdMediaIds.length > 0) {
      await database.pool.query("delete from media where id = any($1::uuid[])", [
        createdMediaIds,
      ]);
    }
    await database.pool.query(
      "delete from rate_limit_bucket where route like $1",
      [`${prefix}%`],
    );
    await database.pool.query(
      "delete from site_setting where key = 'dealer_portal_url' and updated_by = $1",
      [adminUserId],
    );
    await database.pool.query("delete from location where id = $1", [locationId]);
    await database.pool.query("delete from department where id = $1", [
      departmentId,
    ]);
    await database.pool.end();
  });

  async function createMedia(
    storageClass: "protected" | "quarantine",
    scanStatus: "clean" | "pending" | "error" =
      storageClass === "protected" ? "clean" : "pending",
    requestedAt = new Date(),
  ) {
    const id = randomUUID();
    const key = `cv/2026/08/${randomUUID()}.pdf`;
    createdMediaIds.push(id);
    await database.pool.query(
      `insert into media
        (id, storage_class, storage_key, original_filename, mime_type,
         size_bytes, scan_status, scan_attempt_count, scan_requested_at)
       values ($1, $2, $3, 'candidate.pdf', 'application/pdf', 20, $4, 1, $5)`,
      [id, storageClass, key, scanStatus, requestedAt],
    );
    return { id, key };
  }

  async function createApplication(fileId: string) {
    const id = randomUUID();
    await database.pool.query(
      `insert into career_application
        (id, first_name, last_name, phone_normalized, email_normalized,
         department_id, location_id, knows_company, expected_salary_try,
         available_from, about_text, cv_file_id, locale,
         privacy_notice_version, privacy_notice_shown_at, status,
         retention_due_at)
       values
        ($1, 'Test', 'Candidate', '+905551112233', 'candidate@example.test',
         $2, $3, false, 1000, '2026-09-01', 'Test biography', $4, 'tr',
         'test-v1', now(), 'new', now() + interval '30 days')`,
      [id, departmentId, locationId, fileId],
    );
    return id;
  }

  it("seeds the complete role/permission catalog with its limited scopes", async () => {
    const result = await database.pool.query<{
      role_key: RoleKey;
      permission_key: string;
      scope: string;
    }>(
      `select r.key as role_key, p.key as permission_key, rp.scope::text as scope
         from role_permission rp
         join role r on r.id = rp.role_id
         join permission p on p.id = rp.permission_id`,
    );
    for (const role of Object.keys(rolePermissionGrants) as RoleKey[]) {
      const actual = result.rows
        .filter(({ role_key }) => role_key === role)
        .map(({ permission_key, scope }) => `${permission_key}|${scope}`)
        .sort();
      const expected = rolePermissionGrants[role]
        .map(({ key, scope }) => `${key}|${scope}`)
        .sort();
      expect(actual).toEqual(expected);
    }
    expect(
      new Set(result.rows.map(({ permission_key }) => permission_key)).size,
    ).toBe(permissionKeys.length);
  });

  it("makes audit rows append-only at the database boundary", async () => {
    const id = randomUUID();
    await database.pool.query(
      `insert into audit_event (id, event_type, resource_type, metadata_redacted)
       values ($1, 'security.test', 'test', '{}'::jsonb)`,
      [id],
    );
    await expect(
      database.pool.query("update audit_event set event_type = 'changed' where id = $1", [
        id,
      ]),
    ).rejects.toThrow(/append-only/);
    await expect(
      database.pool.query("delete from audit_event where id = $1", [id]),
    ).rejects.toThrow(/append-only/);
  });

  it("keeps scanner failure, timeout and promotion failure quarantined", async () => {
    const storage = new FakeCvStorage();
    const failed = await createMedia("quarantine");
    const result = await processGuardDutyScanEvent(
      database.db,
      storage,
      {
        eventId: randomUUID(),
        bucketName: "quarantine-test",
        objectKey: failed.key,
        result: "FAILED",
      },
      { expectedQuarantineBucket: "quarantine-test", alert: () => undefined },
    );
    expect(result).toBe("failed_closed");
    let [row] = await database.db
      .select({ storageClass: media.storageClass, scanStatus: media.scanStatus })
      .from(media)
      .where(eq(media.id, failed.id));
    expect(row).toEqual({ storageClass: "quarantine", scanStatus: "error" });

    const timedOut = await createMedia(
      "quarantine",
      "pending",
      new Date(Date.now() - 60 * 60_000),
    );
    expect(
      await markTimedOutCvScans(database.db, {
        timeoutMinutes: 15,
        alert: () => undefined,
      }),
    ).toBeGreaterThanOrEqual(1);
    [row] = await database.db
      .select({ storageClass: media.storageClass, scanStatus: media.scanStatus })
      .from(media)
      .where(eq(media.id, timedOut.id));
    expect(row).toEqual({ storageClass: "quarantine", scanStatus: "error" });

    const cleanButStorageDown = await createMedia("quarantine");
    storage.failPromotion = true;
    expect(
      await processGuardDutyScanEvent(
        database.db,
        storage,
        {
          eventId: randomUUID(),
          bucketName: "quarantine-test",
          objectKey: cleanButStorageDown.key,
          result: "NO_THREATS_FOUND",
        },
        { expectedQuarantineBucket: "quarantine-test", alert: () => undefined },
      ),
    ).toBe("failed_closed");
    [row] = await database.db
      .select({ storageClass: media.storageClass, scanStatus: media.scanStatus })
      .from(media)
      .where(eq(media.id, cleanButStorageDown.id));
    expect(row).toEqual({ storageClass: "quarantine", scanStatus: "error" });
  });

  it("denies unscanned, non-MFA and unauthorized CV downloads", async () => {
    const storage = new FakeCvStorage();
    const pendingFile = await createMedia("quarantine");
    const pendingApplication = await createApplication(pendingFile.id);
    await expect(
      downloadProtectedCv(
        database.db,
        storage,
        principal("hr"),
        pendingApplication,
      ),
    ).rejects.toThrowError("resource_not_found");

    const cleanFile = await createMedia("protected", "clean");
    const cleanApplication = await createApplication(cleanFile.id);
    await expect(
      downloadProtectedCv(
        database.db,
        storage,
        principal("content_editor"),
        cleanApplication,
      ),
    ).rejects.toThrowError("permission_denied");
    await expect(
      downloadProtectedCv(
        database.db,
        storage,
        principal("hr", false),
        cleanApplication,
      ),
    ).rejects.toThrowError("mfa_required");

    const object = await downloadProtectedCv(
      database.db,
      storage,
      principal("hr"),
      cleanApplication,
    );
    expect(object.contentType).toBe("application/pdf");
    expect(storage.protectedReads).toEqual([cleanFile.key]);
    const audit = await database.pool.query<{ event_type: string }>(
      `select event_type from audit_event
       where resource_id = $1 and event_type = 'privacy.cv_downloaded'`,
      [cleanApplication],
    );
    expect(audit.rows).toHaveLength(1);
  });

  it("connects login, MFA, role, Dealer Portal and candidate mutations to audit", async () => {
    const nonMfaSession: SessionData = {
      user: { sub: `auth0|${targetUserId}`, amr: ["pwd"] },
      tokenSet: { accessToken: "not-logged", expiresAt: 1 },
      internal: { sid: "test-no-mfa", createdAt: 1 },
    };
    expect(
      await recordAuth0Login(database.db, nonMfaSession, "production"),
    ).toBe(false);
    const session: SessionData = {
      user: { sub: `auth0|${targetUserId}`, amr: ["pwd", "mfa"] },
      tokenSet: { accessToken: "not-logged", expiresAt: 1 },
      internal: { sid: "test", createdAt: 1 },
    };
    expect(await recordAuth0Login(database.db, session)).toBe(true);
    await recordMfaSecurityChange(
      database.db,
      principal("super_admin"),
      targetUserId,
      true,
    );
    const viewerRole = await database.pool.query<{ id: string }>(
      "select id from role where key = 'viewer'",
    );
    await assignRole(
      database.db,
      principal("super_admin"),
      targetUserId,
      viewerRole.rows[0]!.id,
    );
    await updateDealerPortalUrl(
      database.db,
      principal("super_admin"),
      "https://online.bsdotomotiv.com/web",
    );
    const file = await createMedia("protected", "clean");
    const applicationId = await createApplication(file.id);
    await updateCandidateStatus(
      database.db,
      principal("hr"),
      applicationId,
      "in_review",
    );
    const privacyStorage = new FakeCvStorage();
    const anonymizeFile = await createMedia("protected", "clean");
    const anonymizeApplication = await createApplication(anonymizeFile.id);
    await anonymizeCandidate(
      database.db,
      privacyStorage,
      principal("super_admin"),
      anonymizeApplication,
    );
    const deleteFile = await createMedia("protected", "clean");
    const deleteApplication = await createApplication(deleteFile.id);
    await deleteCandidate(
      database.db,
      privacyStorage,
      principal("super_admin"),
      deleteApplication,
    );

    const events = await database.pool.query<{ event_type: string }>(
      `select event_type from audit_event
       where actor_user_id = any($1::uuid[])`,
      [[adminUserId, targetUserId]],
    );
    const eventTypes = new Set(events.rows.map(({ event_type }) => event_type));
    for (const expected of [
      "security.login_succeeded",
      "security.login_denied",
      "security.mfa_enrollment_recorded",
      "security.role_assigned",
      "security.dealer_portal_url_updated",
      "privacy.candidate_status_changed",
      "privacy.candidate_anonymized",
      "privacy.candidate_deleted",
    ]) {
      expect(eventTypes).toContain(expected);
    }
  });

  it("uses an atomic PostgreSQL bucket without storing the raw identifier", async () => {
    const route = `${prefix}-contact`;
    const secret = "0123456789abcdef0123456789abcdef";
    const now = new Date("2026-08-18T12:00:00Z");
    await enforceRateLimit(
      database.db,
      "203.0.113.15",
      { route, limit: 2, windowSeconds: 60 },
      { secret, now },
    );
    await enforceRateLimit(
      database.db,
      "203.0.113.15",
      { route, limit: 2, windowSeconds: 60 },
      { secret, now },
    );
    await expect(
      enforceRateLimit(
        database.db,
        "203.0.113.15",
        { route, limit: 2, windowSeconds: 60 },
        { secret, now },
      ),
    ).rejects.toThrowError("rate_limit_exceeded");
    const stored = await database.pool.query<{
      identifier_hash: string;
      request_count: number;
    }>(
      "select identifier_hash, request_count from rate_limit_bucket where route = $1",
      [route],
    );
    expect(stored.rows[0]?.identifier_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.rows[0]?.identifier_hash).not.toContain("203.0.113.15");
    expect(stored.rows[0]?.request_count).toBe(3);
  });
});
