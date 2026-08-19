import { and, desc, eq, gte, ilike, isNull, lte, or, type SQL } from "drizzle-orm";

import type { DatabaseClient } from "@/db/client";
import { contactSubmissionNotes, contactSubmissions } from "@/db/schema";
import { appendAuditEvent } from "@/security/audit";
import { InvalidSecurityInputError, ResourceNotFoundError } from "@/security/errors";
import { assertAuthorized, type AdminPrincipal } from "@/security/rbac/authorization";

export const contactInboxStatuses = ["new", "read", "replied", "archived"] as const;
export type ContactInboxStatus = (typeof contactInboxStatuses)[number];

export type ContactInboxFilters = {
  status?: ContactInboxStatus;
  query?: string;
  from?: Date;
  to?: Date;
  limit?: number;
};

export async function listContactInbox(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  filters: ContactInboxFilters = {},
) {
  assertAuthorized(principal, { permission: "Contact:view", environment: process.env.APP_ENV });
  const conditions: SQL[] = [isNull(contactSubmissions.anonymizedAt)];
  if (filters.status) {
    if (!contactInboxStatuses.includes(filters.status)) {
      throw new InvalidSecurityInputError("contact_status_invalid");
    }
    conditions.push(eq(contactSubmissions.status, filters.status));
  }
  const query = filters.query?.trim().slice(0, 120);
  if (query) {
    conditions.push(or(
      ilike(contactSubmissions.name, `%${query}%`),
      ilike(contactSubmissions.subject, `%${query}%`),
    )!);
  }
  if (filters.from) conditions.push(gte(contactSubmissions.createdAt, filters.from));
  if (filters.to) conditions.push(lte(contactSubmissions.createdAt, filters.to));
  const limit = Math.max(1, Math.min(100, filters.limit ?? 50));
  return db.select({
    id: contactSubmissions.id,
    createdAt: contactSubmissions.createdAt,
    name: contactSubmissions.name,
    subject: contactSubmissions.subject,
    status: contactSubmissions.status,
    locale: contactSubmissions.locale,
  }).from(contactSubmissions)
    .where(and(...conditions))
    .orderBy(desc(contactSubmissions.createdAt))
    .limit(limit);
}

export async function getContactInboxDetail(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  submissionId: string,
) {
  assertAuthorized(principal, { permission: "Contact:view", environment: process.env.APP_ENV });
  const [submission] = await db.select({
    id: contactSubmissions.id,
    name: contactSubmissions.name,
    company: contactSubmissions.company,
    email: contactSubmissions.emailNormalized,
    phone: contactSubmissions.phoneNormalized,
    subject: contactSubmissions.subject,
    message: contactSubmissions.message,
    locale: contactSubmissions.locale,
    privacyNoticeVersion: contactSubmissions.privacyNoticeVersion,
    privacyNoticeShownAt: contactSubmissions.privacyNoticeShownAt,
    privacyAcknowledgedAt: contactSubmissions.privacyAcknowledgedAt,
    status: contactSubmissions.status,
    createdAt: contactSubmissions.createdAt,
    retentionDueAt: contactSubmissions.retentionDueAt,
    retentionHoldUntil: contactSubmissions.retentionHoldUntil,
    anonymizedAt: contactSubmissions.anonymizedAt,
  }).from(contactSubmissions).where(eq(contactSubmissions.id, submissionId)).limit(1);
  if (!submission) throw new ResourceNotFoundError();
  const notes = await db.select({
    id: contactSubmissionNotes.id,
    body: contactSubmissionNotes.body,
    createdBy: contactSubmissionNotes.createdBy,
    createdAt: contactSubmissionNotes.createdAt,
  }).from(contactSubmissionNotes)
    .where(eq(contactSubmissionNotes.contactSubmissionId, submissionId))
    .orderBy(desc(contactSubmissionNotes.createdAt));
  return { submission, notes };
}

export async function updateContactInboxStatus(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  submissionId: string,
  status: ContactInboxStatus,
) {
  assertAuthorized(principal, { permission: "Contact:update-status", environment: process.env.APP_ENV });
  if (!contactInboxStatuses.includes(status)) {
    throw new InvalidSecurityInputError("contact_status_invalid");
  }
  return db.transaction(async (transaction) => {
    const [existing] = await transaction.select({ status: contactSubmissions.status })
      .from(contactSubmissions).where(eq(contactSubmissions.id, submissionId)).limit(1);
    if (!existing) throw new ResourceNotFoundError();
    await transaction.update(contactSubmissions).set({ status })
      .where(eq(contactSubmissions.id, submissionId));
    await appendAuditEvent(transaction, {
      actorUserId: principal.userId,
      eventType: "contact.status_updated",
      resourceType: "contact_submission",
      resourceId: submissionId,
      metadata: { oldStatus: existing.status, newStatus: status },
    });
    return { id: submissionId, status };
  });
}

export async function addContactInboxNote(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  submissionId: string,
  body: string,
) {
  assertAuthorized(principal, { permission: "Contact:internal-note", environment: process.env.APP_ENV });
  const normalized = body.trim();
  if (!normalized || normalized.length > 4_000) {
    throw new InvalidSecurityInputError("contact_note_invalid");
  }
  return db.transaction(async (transaction) => {
    const [submission] = await transaction.select({ id: contactSubmissions.id })
      .from(contactSubmissions).where(eq(contactSubmissions.id, submissionId)).limit(1);
    if (!submission) throw new ResourceNotFoundError();
    const [note] = await transaction.insert(contactSubmissionNotes).values({
      contactSubmissionId: submissionId,
      body: normalized,
      createdBy: principal.userId,
    }).returning({ id: contactSubmissionNotes.id, createdAt: contactSubmissionNotes.createdAt });
    await appendAuditEvent(transaction, {
      actorUserId: principal.userId,
      eventType: "contact.internal_note_added",
      resourceType: "contact_submission",
      resourceId: submissionId,
      metadata: { noteId: note?.id },
    });
    return note;
  });
}

export async function executeDueContactRetention(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  submissionId: string,
  now = new Date(),
) {
  assertAuthorized(principal, {
    permission: "Contact:delete",
    scope: "retention",
    environment: process.env.APP_ENV,
  });
  const [eligible] = await db.select({ id: contactSubmissions.id })
    .from(contactSubmissions)
    .where(and(
      eq(contactSubmissions.id, submissionId),
      isNull(contactSubmissions.anonymizedAt),
      lte(contactSubmissions.retentionDueAt, now),
      or(isNull(contactSubmissions.retentionHoldUntil), lte(contactSubmissions.retentionHoldUntil, now)),
    )).limit(1);
  if (!eligible) throw new InvalidSecurityInputError("contact_retention_not_due");
  return db.transaction(async (transaction) => {
    await transaction.delete(contactSubmissionNotes)
      .where(eq(contactSubmissionNotes.contactSubmissionId, submissionId));
    await transaction.update(contactSubmissions).set({
      idempotencyKeyHash: null,
      name: null,
      company: null,
      emailNormalized: null,
      phoneNormalized: null,
      subject: null,
      message: null,
      status: "archived",
      anonymizedAt: now,
    }).where(eq(contactSubmissions.id, submissionId));
    await appendAuditEvent(transaction, {
      actorUserId: principal.userId,
      eventType: "privacy.contact_anonymized",
      resourceType: "contact_submission",
      resourceId: submissionId,
      metadata: { source: "approved_retention_workflow" },
    });
    return { id: submissionId, anonymizedAt: now };
  });
}
