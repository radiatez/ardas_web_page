import "server-only";

import { redirect } from "next/navigation";

import { resolveAdminPrincipal } from "@/auth/admin-access";
import { getAuth0Client, hasCompleteAuth0Configuration } from "@/auth/auth0";
import { getRuntimeDatabase } from "@/db/runtime";
import { SecurityBoundaryError } from "@/security/errors";
import { assertAuthorized, type AdminPrincipal } from "@/security/rbac/authorization";
import type { PermissionKey, PermissionScope } from "@/security/rbac/catalog";

export async function resolveRequestAdminPrincipal(): Promise<AdminPrincipal | null> {
  if (!hasCompleteAuth0Configuration()) return null;
  const session = await getAuth0Client().getSession();
  const { db } = getRuntimeDatabase();
  return resolveAdminPrincipal(db, session);
}

export async function requireRequestAdminPermission(
  permission: PermissionKey,
  options: { scope?: PermissionScope; requireMfa?: boolean } = {},
) {
  const principal = await resolveRequestAdminPrincipal();
  assertAuthorized(principal, {
    permission,
    scope: options.scope,
    requireMfa: options.requireMfa,
    environment: process.env.APP_ENV,
  });
  return principal;
}

export async function requireAdminPagePermission(
  permission: PermissionKey,
  options: { scope?: PermissionScope; returnTo?: string } = {},
) {
  if (!hasCompleteAuth0Configuration()) redirect("/admin/yapilandirma-gerekli");
  const principal = await resolveRequestAdminPrincipal();
  if (!principal) {
    const returnTo = options.returnTo?.startsWith("/") ? options.returnTo : "/admin";
    redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  try {
    assertAuthorized(principal, {
      permission,
      scope: options.scope,
      environment: process.env.APP_ENV,
    });
  } catch (error) {
    if (error instanceof SecurityBoundaryError) redirect("/admin/erisilemiyor");
    throw error;
  }
  return principal;
}

export function adminApiError(error: unknown) {
  if (error instanceof SecurityBoundaryError) {
    return Response.json({ error: error.code }, { status: error.status });
  }
  return Response.json({ error: "admin_operation_failed" }, { status: 500 });
}
