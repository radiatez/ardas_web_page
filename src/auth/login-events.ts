import type { SessionData } from "@auth0/nextjs-auth0/types";
import { eq } from "drizzle-orm";

import type { DatabaseClient } from "../db/client";
import { adminUsers } from "../db/schema";
import { appendAuditEvent } from "../security/audit";
import { sessionUsedMfa } from "./admin-access";

export async function recordAuth0Login(
  db: DatabaseClient,
  session: SessionData,
  environment = process.env.APP_ENV,
): Promise<boolean> {
  const [user] = await db
    .select({
      id: adminUsers.id,
      status: adminUsers.status,
      mfaEnrolledAt: adminUsers.mfaEnrolledAt,
    })
    .from(adminUsers)
    .where(eq(adminUsers.auth0Subject, session.user.sub))
    .limit(1);
  const usedMfa = sessionUsedMfa(session);

  if (!user || user.status !== "active") {
    await appendAuditEvent(db, {
      actorUserId: user?.id,
      eventType: "security.login_denied",
      resourceType: "admin_session",
      metadata: { reason: user ? "account_inactive" : "account_unregistered" },
    });
    return false;
  }
  if (environment === "production" && !usedMfa) {
    await appendAuditEvent(db, {
      actorUserId: user.id,
      eventType: "security.login_denied",
      resourceType: "admin_session",
      metadata: { reason: "mfa_required" },
    });
    return false;
  }

  const now = new Date();
  await db
    .update(adminUsers)
    .set({
      lastLoginAt: now,
      updatedAt: now,
      mfaEnrolledAt: usedMfa ? (user.mfaEnrolledAt ?? now) : user.mfaEnrolledAt,
    })
    .where(eq(adminUsers.id, user.id));
  await appendAuditEvent(db, {
    actorUserId: user.id,
    eventType: "security.login_succeeded",
    resourceType: "admin_session",
    metadata: { mfa: usedMfa },
  });

  return true;
}
