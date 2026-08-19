import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  addCareerApplicationNote,
  getCareerApplicationDetail,
  listCareerApplicationAuditTrail,
  listCareerApplications,
} from "../../src/admin/career-applications";
import { listContactInbox } from "../../src/admin/contact-inbox";
import { createDatabase } from "../../src/db/client";
import { updateCandidateStatus } from "../../src/security/admin-mutations";
import { downloadProtectedCv } from "../../src/security/cv/download";
import type {
  CvObjectStorage,
  ProtectedCvObject,
} from "../../src/security/cv/storage";
import { updateDealerPortalUrl } from "../../src/security/dealer-portal";
import {
  anonymizeCandidate,
  deleteCandidate,
} from "../../src/security/privacy-retention";
import {
  assertAuthorized,
  createPermissions,
  type AdminPrincipal,
} from "../../src/security/rbac/authorization";
import {
  rolePermissionGrants,
  type RoleKey,
} from "../../src/security/rbac/catalog";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

class FakeCvStorage implements CvObjectStorage {
  protectedReads: string[] = [];
  protectedDeletes: string[] = [];
  quarantineDeletes: string[] = [];

  async putQuarantine(): Promise<void> {}
  async promoteToProtected(): Promise<void> {}
  async requeueQuarantine(): Promise<void> {}

  async readProtected(key: string): Promise<ProtectedCvObject> {
    this.protectedReads.push(key);
    return {
      bytes: new TextEncoder().encode("%PDF-1.7\n%%EOF"),
      contentType: "application/pdf",
    };
  }

  async deleteProtected(key: string): Promise<void> {
    this.protectedDeletes.push(key);
  }

  async deleteQuarantine(key: string): Promise<void> {
    this.quarantineDeletes.push(key);
  }
}

describeWithDatabase("Milestone 7 HR Application Management on PostgreSQL", () => {
  const prefix = `m7-${randomUUID()}`;
  const adminUserId = randomUUID();
  const departmentId = randomUUID();
  const otherDepartmentId = randomUUID();
  const locationId = randomUUID();
  const otherLocationId = randomUUID();
  const mediaIds: string[] = [];
  const database = databaseUrl ? createDatabase(databaseUrl) : undefined;
  const storage = new FakeCvStorage();

  function principal(
    role: RoleKey,
    mfaAuthenticated = true,
  ): AdminPrincipal {
    return {
      userId: adminUserId,
      auth0Subject: `auth0|${adminUserId}`,
      mfaAuthenticated,
      permissions: createPermissions(rolePermissionGrants[role]),
    };
  }

  async function createMedia(
    storageClass: "protected" | "quarantine",
    scanStatus: "clean" | "pending" | "error" | "infected" | null,
  ) {
    const id = randomUUID();
    const key = `cv/test/${randomUUID()}.pdf`;
    mediaIds.push(id);
    await database!.pool.query(
      `insert into media
        (id, storage_class, storage_key, original_filename, mime_type,
         size_bytes, scan_status, scan_attempt_count, scan_requested_at)
       values ($1, $2, $3, 'private-candidate-name.pdf', 'application/pdf',
         128, $4, 1, now())`,
      [id, storageClass, key, scanStatus],
    );
    return { id, key };
  }

  async function createApplication(options: {
    cvFileId: string;
    firstName: string;
    lastName?: string;
    departmentId?: string;
    locationId?: string;
    status?: "new" | "in_review" | "interview" | "rejected" | "hired" | "archived";
    createdAt?: Date;
    retentionDueAt?: Date;
    retentionHoldUntil?: Date;
  }) {
    const id = randomUUID();
    await database!.pool.query(
      `insert into career_application
        (id, first_name, last_name, phone_normalized, email_normalized,
         department_id, location_id, knows_company, expected_salary_try,
         available_from, about_text, cv_file_id, locale,
         privacy_notice_version, privacy_notice_shown_at,
         privacy_acknowledged_at, status, created_at, updated_at,
         retention_due_at, retention_hold_until)
       values
        ($1, $2, $3, '+905551112233', 'candidate@example.test',
         $4, $5, false, 45000, '2026-10-01',
         'Audit metadata ve liste görünümüne girmemesi gereken aday tanıtımı',
         $6, 'tr', 'career-test-v1', now(), now(), $7, $8, $8, $9, $10)`,
      [
        id,
        options.firstName,
        options.lastName ?? "Aday",
        options.departmentId ?? departmentId,
        options.locationId ?? locationId,
        options.cvFileId,
        options.status ?? "new",
        options.createdAt ?? new Date("2026-08-12T09:00:00.000Z"),
        options.retentionDueAt ?? new Date("2027-08-12T09:00:00.000Z"),
        options.retentionHoldUntil ?? null,
      ],
    );
    return id;
  }

  let firstApplicationId = "";
  let firstMediaKey = "";

  beforeAll(async () => {
    if (!database) return;
    await database.pool.query(
      `insert into admin_user (id, auth0_subject, email, display_name, status)
       values ($1, $2, $3, 'Milestone 7 HR', 'active')`,
      [adminUserId, `auth0|${adminUserId}`, `${adminUserId}@example.test`],
    );
    await database.pool.query(
      `insert into department (id, key, sort_order, status)
       values ($1, $2, 1, 'active'), ($3, $4, 2, 'active')`,
      [departmentId, `${prefix}-department`, otherDepartmentId, `${prefix}-other-department`],
    );
    await database.pool.query(
      `insert into department_locale (department_id, locale, name)
       values ($1, 'tr', 'Test Departmanı'), ($2, 'tr', 'Diğer Departman')`,
      [departmentId, otherDepartmentId],
    );
    await database.pool.query(
      `insert into location (id, key, sort_order, status)
       values ($1, $2, 1, 'active'), ($3, $4, 2, 'active')`,
      [locationId, `${prefix}-location`, otherLocationId, `${prefix}-other-location`],
    );
    await database.pool.query(
      `insert into location_locale (location_id, locale, name)
       values ($1, 'tr', 'Test Deposu'), ($2, 'tr', 'Diğer Depo')`,
      [locationId, otherLocationId],
    );

    const firstMedia = await createMedia("protected", "clean");
    firstMediaKey = firstMedia.key;
    firstApplicationId = await createApplication({
      cvFileId: firstMedia.id,
      firstName: `${prefix}-Ada`,
      createdAt: new Date("2026-08-12T09:00:00.000Z"),
    });
    const secondMedia = await createMedia("quarantine", "pending");
    await createApplication({
      cvFileId: secondMedia.id,
      firstName: `${prefix}-Bora`,
      departmentId: otherDepartmentId,
      createdAt: new Date("2026-08-11T09:00:00.000Z"),
    });
    const thirdMedia = await createMedia("protected", "clean");
    await createApplication({
      cvFileId: thirdMedia.id,
      firstName: `${prefix}-Cem`,
      locationId: otherLocationId,
      createdAt: new Date("2026-08-10T09:00:00.000Z"),
    });
  });

  afterAll(async () => {
    if (!database) return;
    await database.pool.query(
      "delete from career_application where department_id = any($1::uuid[])",
      [[departmentId, otherDepartmentId]],
    );
    if (mediaIds.length) {
      await database.pool.query("delete from media where id = any($1::uuid[])", [mediaIds]);
    }
    await database.pool.query("delete from location where id = any($1::uuid[])", [
      [locationId, otherLocationId],
    ]);
    await database.pool.query("delete from department where id = any($1::uuid[])", [
      [departmentId, otherDepartmentId],
    ]);
    await database.pool.end();
  });

  it("queries only minimal list fields with server filters and pagination", async () => {
    if (!database) return;
    const hr = principal("hr");
    const firstPage = await listCareerApplications(database.db, hr, {
      query: prefix,
      page: 1,
      pageSize: 2,
      kind: "general",
    });
    expect(firstPage.total).toBe(3);
    expect(firstPage.rows).toHaveLength(2);
    expect(firstPage.totalPages).toBe(2);
    expect(firstPage.rows[0]).not.toHaveProperty("email");
    expect(firstPage.rows[0]).not.toHaveProperty("phone");
    expect(firstPage.rows[0]).not.toHaveProperty("aboutText");
    expect(firstPage.rows[0]).not.toHaveProperty("expectedSalaryTry");
    expect(firstPage.rows.every((row) => row.jobPostingId === null)).toBe(true);

    const statusFiltered = await listCareerApplications(database.db, hr, {
      query: prefix,
      status: "new",
    });
    expect(statusFiltered.total).toBe(3);

    const secondPage = await listCareerApplications(database.db, hr, {
      query: prefix,
      page: 2,
      pageSize: 2,
    });
    expect(secondPage.rows).toHaveLength(1);
    const departmentFiltered = await listCareerApplications(database.db, hr, {
      query: prefix,
      departmentId: otherDepartmentId,
    });
    expect(departmentFiltered.rows).toHaveLength(1);
    const locationFiltered = await listCareerApplications(database.db, hr, {
      query: prefix,
      locationId: otherLocationId,
    });
    expect(locationFiltered.rows).toHaveLength(1);
    const dated = await listCareerApplications(database.db, hr, {
      query: prefix,
      from: new Date("2026-08-11T00:00:00.000Z"),
      to: new Date("2026-08-11T23:59:59.999Z"),
    });
    expect(dated.rows).toHaveLength(1);
    expect((await listCareerApplications(database.db, hr, { query: prefix, kind: "job_posting" })).total).toBe(0);
  });

  it("runs E2E-08 detail → note → valid status history with PII-safe audit", async () => {
    if (!database) return;
    const hr = principal("hr");
    const detail = await getCareerApplicationDetail(database.db, hr, firstApplicationId);
    expect(detail.application).toMatchObject({
      email: "candidate@example.test",
      phone: "+905551112233",
      expectedSalaryTry: "45000.00",
      jobPostingId: null,
    });
    await addCareerApplicationNote(
      database.db,
      hr,
      firstApplicationId,
      "Yalnız HR ekranında görünmesi gereken iç not",
    );
    await updateCandidateStatus(database.db, hr, firstApplicationId, "in_review");
    await expect(
      updateCandidateStatus(database.db, hr, firstApplicationId, "hired"),
    ).rejects.toThrowError("application_status_transition_invalid");

    const updated = await getCareerApplicationDetail(database.db, hr, firstApplicationId);
    expect(updated.notes[0]?.body).toContain("Yalnız HR");
    expect(updated.history[0]).toMatchObject({ fromStatus: "new", toStatus: "in_review" });
    const audit = await database.pool.query<{ event_type: string; metadata: string }>(
      `select event_type, metadata_redacted::text as metadata
       from audit_event
       where resource_id = $1
         and event_type in (
           'privacy.candidate_detail_viewed',
           'privacy.candidate_internal_note_added',
           'privacy.candidate_status_changed'
         )`,
      [firstApplicationId],
    );
    expect(audit.rows.map((row) => row.event_type)).toEqual(expect.arrayContaining([
      "privacy.candidate_detail_viewed",
      "privacy.candidate_internal_note_added",
      "privacy.candidate_status_changed",
    ]));
    const metadata = audit.rows.map((row) => row.metadata).join(" ");
    expect(metadata).not.toContain("Yalnız HR");
    expect(metadata).not.toContain("candidate@example.test");
    expect(metadata).not.toContain("private-candidate-name.pdf");
    await expect(
      listCareerApplicationAuditTrail(database.db, hr, firstApplicationId),
    ).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ eventType: "privacy.candidate_status_changed" }),
    ]));
    await expect(
      listCareerApplicationAuditTrail(
        database.db,
        principal("contact_manager"),
        firstApplicationId,
      ),
    ).rejects.toThrowError("permission_denied");
  });

  it("runs E2E-09 RBAC denials and all fail-closed CV states", async () => {
    if (!database) return;
    const hr = principal("hr");
    const downloaded = await downloadProtectedCv(
      database.db,
      storage,
      hr,
      firstApplicationId,
    );
    expect(downloaded.contentType).toBe("application/pdf");
    expect(storage.protectedReads).toContain(firstMediaKey);

    for (const role of ["content_editor", "contact_manager", "viewer"] as const) {
      await expect(listCareerApplications(database.db, principal(role))).rejects.toThrowError("permission_denied");
      await expect(getCareerApplicationDetail(database.db, principal(role), firstApplicationId)).rejects.toThrowError("permission_denied");
      await expect(downloadProtectedCv(database.db, storage, principal(role), firstApplicationId)).rejects.toThrowError("permission_denied");
    }
    await expect(downloadProtectedCv(database.db, storage, principal("hr", false), firstApplicationId)).rejects.toThrowError("mfa_required");
    await expect(updateDealerPortalUrl(database.db, hr, "https://online.bsdotomotiv.com/web")).rejects.toThrowError("permission_denied");
    await expect(listContactInbox(database.db, hr)).rejects.toThrowError("permission_denied");
    expect(() => assertAuthorized(hr, { permission: "Users:view" })).toThrowError("permission_denied");
    expect(() => assertAuthorized(hr, { permission: "Roles:assign" })).toThrowError("permission_denied");
    const superAdmin = principal("super_admin");
    await expect(listCareerApplications(database.db, superAdmin, { query: prefix })).resolves.toMatchObject({ total: 3 });
    await expect(getCareerApplicationDetail(database.db, superAdmin, firstApplicationId)).resolves.toBeDefined();
    await addCareerApplicationNote(database.db, superAdmin, firstApplicationId, "Super Admin HR operasyon notu");
    await updateCandidateStatus(database.db, superAdmin, firstApplicationId, "interview");
    await expect(downloadProtectedCv(database.db, storage, superAdmin, firstApplicationId)).resolves.toMatchObject({ contentType: "application/pdf" });

    const cases = [
      ["pending", "quarantine", "pending"],
      ["quarantine", "quarantine", "clean"],
      ["error", "quarantine", "error"],
      ["infected", "quarantine", "infected"],
      ["missing", "quarantine", null],
    ] as const;
    for (const [label, storageClass, scanStatus] of cases) {
      const file = await createMedia(storageClass, scanStatus);
      const applicationId = await createApplication({
        cvFileId: file.id,
        firstName: `${prefix}-${label}`,
      });
      await expect(
        downloadProtectedCv(database.db, storage, hr, applicationId),
        label,
      ).rejects.toThrowError("resource_not_found");
    }
    const wrongRelationFile = await createMedia("quarantine", "pending");
    const wrongRelationApplication = await createApplication({
      cvFileId: wrongRelationFile.id,
      firstName: `${prefix}-WrongRelation`,
    });
    const unrelatedClean = await createMedia("protected", "clean");
    await expect(
      downloadProtectedCv(database.db, storage, hr, wrongRelationApplication),
    ).rejects.toThrowError("resource_not_found");
    expect(storage.protectedReads).not.toContain(unrelatedClean.key);
  });

  it("enforces due-only HR retention, preserves history/audit and limits delete override", async () => {
    if (!database) return;
    const hr = principal("hr");
    const superAdmin = principal("super_admin");
    const dueFile = await createMedia("protected", "clean");
    const dueApplication = await createApplication({
      cvFileId: dueFile.id,
      firstName: `${prefix}-Due`,
      retentionDueAt: new Date("2020-01-01T00:00:00.000Z"),
    });
    await addCareerApplicationNote(database.db, hr, dueApplication, "Retention ile silinecek not");
    await updateCandidateStatus(database.db, hr, dueApplication, "in_review");
    await anonymizeCandidate(database.db, storage, hr, dueApplication);

    const anonymized = await database.pool.query<{
      first_name: string | null;
      cv_file_id: string | null;
      anonymized_at: Date | null;
      status: string;
    }>("select first_name, cv_file_id, anonymized_at, status from career_application where id = $1", [dueApplication]);
    expect(anonymized.rows[0]).toMatchObject({ first_name: null, cv_file_id: null, status: "archived" });
    expect(anonymized.rows[0]?.anonymized_at).toBeInstanceOf(Date);
    expect(storage.protectedDeletes).toContain(dueFile.key);
    expect((await database.pool.query("select id from career_application_note where application_id = $1", [dueApplication])).rows).toHaveLength(0);
    expect((await database.pool.query("select id from application_status_history where application_id = $1", [dueApplication])).rows).toHaveLength(1);

    const futureFile = await createMedia("protected", "clean");
    const futureApplication = await createApplication({
      cvFileId: futureFile.id,
      firstName: `${prefix}-Future`,
      retentionDueAt: new Date("2099-01-01T00:00:00.000Z"),
    });
    await expect(anonymizeCandidate(database.db, storage, hr, futureApplication)).rejects.toThrowError("candidate_retention_not_due");
    await expect(deleteCandidate(database.db, storage, hr, futureApplication)).rejects.toThrowError("permission_denied");
    await anonymizeCandidate(database.db, storage, superAdmin, futureApplication);

    const heldFile = await createMedia("protected", "clean");
    const heldApplication = await createApplication({
      cvFileId: heldFile.id,
      firstName: `${prefix}-Held`,
      retentionDueAt: new Date("2020-01-01T00:00:00.000Z"),
      retentionHoldUntil: new Date("2099-01-01T00:00:00.000Z"),
    });
    await expect(anonymizeCandidate(database.db, storage, hr, heldApplication)).rejects.toThrowError("candidate_retention_not_due");

    const deleteFile = await createMedia("protected", "clean");
    const deleteApplicationId = await createApplication({
      cvFileId: deleteFile.id,
      firstName: `${prefix}-Delete`,
    });
    await deleteCandidate(database.db, storage, superAdmin, deleteApplicationId);
    expect((await database.pool.query("select id from career_application where id = $1", [deleteApplicationId])).rows).toHaveLength(0);
    const audit = await database.pool.query<{ event_type: string; metadata: string }>(
      `select event_type, metadata_redacted::text as metadata from audit_event
       where resource_id = any($1::uuid[])
         and event_type in ('privacy.candidate_anonymized', 'privacy.candidate_deleted')`,
      [[dueApplication, futureApplication, deleteApplicationId]],
    );
    expect(audit.rows.map((row) => row.event_type)).toEqual(expect.arrayContaining([
      "privacy.candidate_anonymized",
      "privacy.candidate_deleted",
    ]));
    expect(audit.rows.map((row) => row.metadata).join(" ")).not.toContain(prefix);
  });
});
