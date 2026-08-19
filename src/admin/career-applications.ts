import {
  and,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  isNull,
  lte,
  sql,
  type SQL,
} from "drizzle-orm";

import type { DatabaseClient } from "@/db/client";
import {
  adminUsers,
  applicationStatusHistory,
  auditEvents,
  careerApplicationNotes,
  careerApplications,
  departmentLocales,
  departments,
  jobPostingLocales,
  locationLocales,
  locations,
  media,
} from "@/db/schema";
import { appendAuditEvent } from "@/security/audit";
import {
  applicationStatuses,
  type ApplicationStatus,
} from "@/security/admin-mutations";
import {
  InvalidSecurityInputError,
  ResourceNotFoundError,
} from "@/security/errors";
import {
  assertAuthorized,
  type AdminPrincipal,
} from "@/security/rbac/authorization";

export { applicationStatuses };
export type { ApplicationStatus };

export const applicationKinds = ["general", "job_posting"] as const;
export type ApplicationKind = (typeof applicationKinds)[number];

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CareerApplicationFilters = {
  query?: string;
  from?: Date;
  to?: Date;
  status?: ApplicationStatus;
  departmentId?: string;
  locationId?: string;
  kind?: ApplicationKind;
  page?: number;
  pageSize?: number;
};

function assertValidDate(value: Date | undefined, code: string) {
  if (value && Number.isNaN(value.getTime())) {
    throw new InvalidSecurityInputError(code);
  }
}

function assertValidOptionalId(value: string | undefined, code: string) {
  if (value && !uuidPattern.test(value)) {
    throw new InvalidSecurityInputError(code);
  }
}

function buildListConditions(filters: CareerApplicationFilters): SQL[] {
  const conditions: SQL[] = [isNull(careerApplications.anonymizedAt)];
  if (filters.status) {
    if (!applicationStatuses.includes(filters.status)) {
      throw new InvalidSecurityInputError("application_status_invalid");
    }
    conditions.push(eq(careerApplications.status, filters.status));
  }
  assertValidOptionalId(filters.departmentId, "application_department_invalid");
  assertValidOptionalId(filters.locationId, "application_location_invalid");
  if (filters.departmentId) {
    conditions.push(eq(careerApplications.departmentId, filters.departmentId));
  }
  if (filters.locationId) {
    conditions.push(eq(careerApplications.locationId, filters.locationId));
  }
  if (filters.kind) {
    if (!applicationKinds.includes(filters.kind)) {
      throw new InvalidSecurityInputError("application_kind_invalid");
    }
    conditions.push(
      filters.kind === "general"
        ? isNull(careerApplications.jobPostingId)
        : isNotNull(careerApplications.jobPostingId),
    );
  }
  const query = filters.query?.trim().slice(0, 120);
  if (query) {
    conditions.push(
      ilike(
        sql`concat_ws(' ', ${careerApplications.firstName}, ${careerApplications.lastName})`,
        `%${query}%`,
      ),
    );
  }
  assertValidDate(filters.from, "application_date_from_invalid");
  assertValidDate(filters.to, "application_date_to_invalid");
  if (filters.from) conditions.push(gte(careerApplications.createdAt, filters.from));
  if (filters.to) conditions.push(lte(careerApplications.createdAt, filters.to));
  return conditions;
}

export async function listCareerApplications(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  filters: CareerApplicationFilters = {},
) {
  assertAuthorized(principal, {
    permission: "Applications:view",
    environment: process.env.APP_ENV,
  });
  const conditions = buildListConditions(filters);
  const pageSize = Math.max(1, Math.min(50, Math.trunc(filters.pageSize ?? 25)));
  const page = Math.max(1, Math.min(10_000, Math.trunc(filters.page ?? 1)));
  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: careerApplications.id,
        createdAt: careerApplications.createdAt,
        firstName: careerApplications.firstName,
        lastName: careerApplications.lastName,
        departmentKey: departments.key,
        departmentName: departmentLocales.name,
        locationKey: locations.key,
        locationName: locationLocales.name,
        status: careerApplications.status,
        storageClass: media.storageClass,
        scanStatus: media.scanStatus,
        availableFrom: careerApplications.availableFrom,
        jobPostingId: careerApplications.jobPostingId,
        jobPostingTitle: jobPostingLocales.title,
        retentionDueAt: careerApplications.retentionDueAt,
        retentionHoldUntil: careerApplications.retentionHoldUntil,
      })
      .from(careerApplications)
      .innerJoin(departments, eq(departments.id, careerApplications.departmentId))
      .leftJoin(
        departmentLocales,
        and(
          eq(departmentLocales.departmentId, departments.id),
          eq(departmentLocales.locale, "tr"),
        ),
      )
      .innerJoin(locations, eq(locations.id, careerApplications.locationId))
      .leftJoin(
        locationLocales,
        and(
          eq(locationLocales.locationId, locations.id),
          eq(locationLocales.locale, "tr"),
        ),
      )
      .leftJoin(media, eq(media.id, careerApplications.cvFileId))
      .leftJoin(
        jobPostingLocales,
        and(
          eq(jobPostingLocales.jobPostingId, careerApplications.jobPostingId),
          eq(jobPostingLocales.locale, "tr"),
        ),
      )
      .where(and(...conditions))
      .orderBy(desc(careerApplications.createdAt), desc(careerApplications.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(careerApplications)
      .where(and(...conditions)),
  ]);
  const total = Number(countRows[0]?.total ?? 0);
  return {
    rows,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listCareerApplicationFilterOptions(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
) {
  assertAuthorized(principal, {
    permission: "Applications:view",
    environment: process.env.APP_ENV,
  });
  const [departmentRows, locationRows] = await Promise.all([
    db
      .select({ id: departments.id, key: departments.key, name: departmentLocales.name })
      .from(departments)
      .leftJoin(
        departmentLocales,
        and(
          eq(departmentLocales.departmentId, departments.id),
          eq(departmentLocales.locale, "tr"),
        ),
      )
      .where(eq(departments.status, "active"))
      .orderBy(departments.sortOrder, departments.key),
    db
      .select({ id: locations.id, key: locations.key, name: locationLocales.name })
      .from(locations)
      .leftJoin(
        locationLocales,
        and(
          eq(locationLocales.locationId, locations.id),
          eq(locationLocales.locale, "tr"),
        ),
      )
      .where(eq(locations.status, "active"))
      .orderBy(locations.sortOrder, locations.key),
  ]);
  return { departments: departmentRows, locations: locationRows };
}

export async function getCareerApplicationDetail(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  applicationId: string,
) {
  assertAuthorized(principal, {
    permission: "Applications:view",
    environment: process.env.APP_ENV,
  });
  if (!uuidPattern.test(applicationId)) throw new ResourceNotFoundError();

  const [application] = await db
    .select({
      id: careerApplications.id,
      firstName: careerApplications.firstName,
      lastName: careerApplications.lastName,
      phone: careerApplications.phoneNormalized,
      email: careerApplications.emailNormalized,
      gender: careerApplications.gender,
      birthDate: careerApplications.birthDate,
      maritalStatus: careerApplications.maritalStatus,
      militaryStatus: careerApplications.militaryStatus,
      defermentDate: careerApplications.defermentDate,
      departmentKey: departments.key,
      departmentName: departmentLocales.name,
      locationKey: locations.key,
      locationName: locationLocales.name,
      knowsCompany: careerApplications.knowsCompany,
      knowsCompanySource: careerApplications.knowsCompanySource,
      expectedSalaryTry: careerApplications.expectedSalaryTry,
      availableFrom: careerApplications.availableFrom,
      aboutText: careerApplications.aboutText,
      locale: careerApplications.locale,
      privacyNoticeVersion: careerApplications.privacyNoticeVersion,
      privacyNoticeShownAt: careerApplications.privacyNoticeShownAt,
      privacyAcknowledgedAt: careerApplications.privacyAcknowledgedAt,
      status: careerApplications.status,
      createdAt: careerApplications.createdAt,
      updatedAt: careerApplications.updatedAt,
      retentionDueAt: careerApplications.retentionDueAt,
      retentionHoldUntil: careerApplications.retentionHoldUntil,
      anonymizedAt: careerApplications.anonymizedAt,
      jobPostingId: careerApplications.jobPostingId,
      jobPostingTitle: jobPostingLocales.title,
      cvFileId: media.id,
      cvStorageClass: media.storageClass,
      cvScanStatus: media.scanStatus,
    })
    .from(careerApplications)
    .innerJoin(departments, eq(departments.id, careerApplications.departmentId))
    .leftJoin(
      departmentLocales,
      and(
        eq(departmentLocales.departmentId, departments.id),
        eq(departmentLocales.locale, "tr"),
      ),
    )
    .innerJoin(locations, eq(locations.id, careerApplications.locationId))
    .leftJoin(
      locationLocales,
      and(
        eq(locationLocales.locationId, locations.id),
        eq(locationLocales.locale, "tr"),
      ),
    )
    .leftJoin(media, eq(media.id, careerApplications.cvFileId))
    .leftJoin(
      jobPostingLocales,
      and(
        eq(jobPostingLocales.jobPostingId, careerApplications.jobPostingId),
        eq(jobPostingLocales.locale, "tr"),
      ),
    )
    .where(eq(careerApplications.id, applicationId))
    .limit(1);
  if (!application) throw new ResourceNotFoundError();

  const [notes, history] = await Promise.all([
    db
      .select({
        id: careerApplicationNotes.id,
        body: careerApplicationNotes.body,
        createdBy: careerApplicationNotes.createdBy,
        authorName: adminUsers.displayName,
        createdAt: careerApplicationNotes.createdAt,
      })
      .from(careerApplicationNotes)
      .leftJoin(adminUsers, eq(adminUsers.id, careerApplicationNotes.createdBy))
      .where(eq(careerApplicationNotes.applicationId, applicationId))
      .orderBy(desc(careerApplicationNotes.createdAt)),
    db
      .select({
        id: applicationStatusHistory.id,
        fromStatus: applicationStatusHistory.fromStatus,
        toStatus: applicationStatusHistory.toStatus,
        changedBy: applicationStatusHistory.changedBy,
        actorName: adminUsers.displayName,
        changedAt: applicationStatusHistory.changedAt,
      })
      .from(applicationStatusHistory)
      .leftJoin(adminUsers, eq(adminUsers.id, applicationStatusHistory.changedBy))
      .where(eq(applicationStatusHistory.applicationId, applicationId))
      .orderBy(desc(applicationStatusHistory.changedAt)),
  ]);

  await appendAuditEvent(db, {
    actorUserId: principal.userId,
    eventType: "privacy.candidate_detail_viewed",
    resourceType: "career_application",
    resourceId: applicationId,
    metadata: { access: "sensitive_detail" },
  });
  return { application, notes, history };
}

export async function addCareerApplicationNote(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  applicationId: string,
  body: string,
) {
  assertAuthorized(principal, {
    permission: "Applications:notes",
    environment: process.env.APP_ENV,
  });
  const normalized = body.trim();
  if (!normalized || normalized.length > 4_000) {
    throw new InvalidSecurityInputError("application_note_invalid");
  }
  return db.transaction(async (transaction) => {
    const [application] = await transaction
      .select({ id: careerApplications.id })
      .from(careerApplications)
      .where(
        and(
          eq(careerApplications.id, applicationId),
          isNull(careerApplications.anonymizedAt),
        ),
      )
      .limit(1);
    if (!application) throw new ResourceNotFoundError();
    const [note] = await transaction
      .insert(careerApplicationNotes)
      .values({ applicationId, body: normalized, createdBy: principal.userId })
      .returning({ id: careerApplicationNotes.id, createdAt: careerApplicationNotes.createdAt });
    await appendAuditEvent(transaction, {
      actorUserId: principal.userId,
      eventType: "privacy.candidate_internal_note_added",
      resourceType: "career_application",
      resourceId: applicationId,
      metadata: { noteId: note?.id },
    });
    return note;
  });
}

export async function listCareerApplicationAuditTrail(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  applicationId: string,
  limit = 50,
) {
  assertAuthorized(principal, {
    permission: "Audit:view-career-scope",
    environment: process.env.APP_ENV,
  });
  if (!uuidPattern.test(applicationId)) throw new ResourceNotFoundError();
  return db
    .select({
      id: auditEvents.id,
      eventType: auditEvents.eventType,
      actorUserId: auditEvents.actorUserId,
      actorName: adminUsers.displayName,
      metadata: auditEvents.metadataRedacted,
      createdAt: auditEvents.createdAt,
    })
    .from(auditEvents)
    .leftJoin(adminUsers, eq(adminUsers.id, auditEvents.actorUserId))
    .where(
      and(
        eq(auditEvents.resourceType, "career_application"),
        eq(auditEvents.resourceId, applicationId),
      ),
    )
    .orderBy(desc(auditEvents.createdAt))
    .limit(Math.max(1, Math.min(100, Math.trunc(limit))));
}
