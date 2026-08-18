import type { SessionData } from "@auth0/nextjs-auth0/types";
import { eq } from "drizzle-orm";

import type { DatabaseClient } from "../db/client";
import {
  adminUsers,
  permissions,
  rolePermissions,
  userRoles,
} from "../db/schema";
import { getRuntimeDatabase } from "../db/runtime";
import type { PermissionKey, PermissionScope } from "../security/rbac/catalog";
import { isPermissionKey, permissionScopes } from "../security/rbac/catalog";
import {
  assertAuthorized,
  createPermissions,
  type AdminPrincipal,
} from "../security/rbac/authorization";

export function sessionUsedMfa(session: Pick<SessionData, "user">): boolean {
  const methods = session.user.amr;
  return Array.isArray(methods) && methods.some((method) => method === "mfa");
}

function isPermissionScope(value: string): value is PermissionScope {
  return permissionScopes.some((scope) => scope === value);
}

export async function resolveAdminPrincipal(
  db: DatabaseClient,
  session: SessionData | null,
): Promise<AdminPrincipal | null> {
  if (!session?.user.sub) {
    return null;
  }

  const [user] = await db
    .select({
      id: adminUsers.id,
      auth0Subject: adminUsers.auth0Subject,
      status: adminUsers.status,
    })
    .from(adminUsers)
    .where(eq(adminUsers.auth0Subject, session.user.sub))
    .limit(1);

  if (!user || user.status !== "active") {
    return null;
  }

  const rows = await db
    .select({ key: permissions.key, scope: rolePermissions.scope })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, userRoles.roleId))
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(eq(userRoles.userId, user.id));

  const grants = rows.flatMap(({ key, scope }) =>
    isPermissionKey(key) && isPermissionScope(scope) ? [{ key, scope }] : [],
  );

  return {
    userId: user.id,
    auth0Subject: user.auth0Subject,
    mfaAuthenticated: sessionUsedMfa(session),
    permissions: createPermissions(grants),
  };
}

export async function requireAdminPermission(
  session: SessionData | null,
  permission: PermissionKey,
  options: { requireMfa?: boolean; scope?: PermissionScope } = {},
) {
  const { db } = getRuntimeDatabase();
  const principal = await resolveAdminPrincipal(db, session);
  assertAuthorized(principal, {
    permission,
    requireMfa: options.requireMfa,
    scope: options.scope,
    environment: process.env.APP_ENV,
  });
  return principal;
}
