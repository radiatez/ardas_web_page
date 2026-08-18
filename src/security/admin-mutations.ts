import { and, eq } from "drizzle-orm";

import type { DatabaseClient } from "../db/client";
import {
  adminUsers,
  applicationStatusHistory,
  careerApplications,
  rolePermissions,
  roles,
  userRoles,
} from "../db/schema";
import { appendAuditEvent } from "./audit";
import { ResourceNotFoundError } from "./errors";
import {
  assertAuthorized,
  type AdminPrincipal,
} from "./rbac/authorization";

export type ApplicationStatus =
  | "new"
  | "in_review"
  | "interview"
  | "rejected"
  | "hired"
  | "archived";

export async function recordMfaSecurityChange(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  targetUserId: string,
  enrolled: boolean,
) {
  assertAuthorized(principal, {
    permission: "Users:edit",
    environment: process.env.APP_ENV,
  });
  const now = new Date();
  const updated = await db
    .update(adminUsers)
    .set({ mfaEnrolledAt: enrolled ? now : null, updatedAt: now })
    .where(eq(adminUsers.id, targetUserId))
    .returning({ id: adminUsers.id });
  if (updated.length === 0) {
    throw new ResourceNotFoundError();
  }
  await appendAuditEvent(db, {
    actorUserId: principal.userId,
    eventType: enrolled
      ? "security.mfa_enrollment_recorded"
      : "security.mfa_reset_recorded",
    resourceType: "admin_user",
    resourceId: targetUserId,
    metadata: { enrolled },
  });
}

export async function assignRole(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  targetUserId: string,
  roleId: string,
) {
  assertAuthorized(principal, {
    permission: "Roles:assign",
    environment: process.env.APP_ENV,
  });
  const [target] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.id, targetUserId))
    .limit(1);
  const [role] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.id, roleId))
    .limit(1);
  if (!target || !role) {
    throw new ResourceNotFoundError();
  }

  await db
    .insert(userRoles)
    .values({ userId: target.id, roleId: role.id })
    .onConflictDoNothing();
  await appendAuditEvent(db, {
    actorUserId: principal.userId,
    eventType: "security.role_assigned",
    resourceType: "admin_user",
    resourceId: target.id,
    metadata: { roleId: role.id },
  });
}

export async function updateCandidateStatus(
  db: DatabaseClient,
  principal: AdminPrincipal | null,
  applicationId: string,
  toStatus: ApplicationStatus,
) {
  assertAuthorized(principal, {
    permission: "Applications:status",
    environment: process.env.APP_ENV,
  });
  const [application] = await db
    .select({ id: careerApplications.id, status: careerApplications.status })
    .from(careerApplications)
    .where(eq(careerApplications.id, applicationId))
    .limit(1);
  if (!application) {
    throw new ResourceNotFoundError();
  }
  if (application.status === toStatus) {
    return;
  }

  const now = new Date();
  await db.transaction(async (transaction) => {
    const changed = await transaction
      .update(careerApplications)
      .set({ status: toStatus, updatedAt: now })
      .where(
        and(
          eq(careerApplications.id, applicationId),
          eq(careerApplications.status, application.status),
        ),
      )
      .returning({ id: careerApplications.id });
    if (changed.length === 0) {
      throw new Error("Candidate status changed concurrently.");
    }
    await transaction.insert(applicationStatusHistory).values({
      applicationId,
      fromStatus: application.status,
      toStatus,
      changedBy: principal.userId,
      changedAt: now,
    });
    await appendAuditEvent(transaction, {
      actorUserId: principal.userId,
      eventType: "privacy.candidate_status_changed",
      resourceType: "career_application",
      resourceId: applicationId,
      metadata: { fromStatus: application.status, toStatus },
    });
  });
}

export async function assertRoleHasPermissionRows(
  db: DatabaseClient,
  roleId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ permissionId: rolePermissions.permissionId })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, roleId))
    .limit(1);
  return Boolean(row);
}
