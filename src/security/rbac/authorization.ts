import type {
  PermissionKey,
  PermissionScope,
} from "./catalog";
import {
  AuthenticationRequiredError,
  MfaRequiredError,
  PermissionDeniedError,
} from "../errors";

export type EffectivePermissions = Partial<
  Record<PermissionKey, readonly PermissionScope[]>
>;

export interface AdminPrincipal {
  userId: string;
  auth0Subject: string;
  mfaAuthenticated: boolean;
  permissions: EffectivePermissions;
}

export interface AuthorizationRequirement {
  permission: PermissionKey;
  scope?: PermissionScope;
  requireMfa?: boolean;
  environment?: string;
}

export function assertAuthenticatedPrincipal(
  principal: AdminPrincipal | null,
): asserts principal is AdminPrincipal {
  if (!principal) {
    throw new AuthenticationRequiredError();
  }
}

export function assertAuthorized(
  principal: AdminPrincipal | null,
  requirement: AuthorizationRequirement,
): asserts principal is AdminPrincipal {
  assertAuthenticatedPrincipal(principal);

  const mfaRequired =
    requirement.requireMfa === true || requirement.environment === "production";
  if (mfaRequired && !principal.mfaAuthenticated) {
    throw new MfaRequiredError();
  }

  const scopes = principal.permissions[requirement.permission];
  if (!scopes || scopes.length === 0) {
    throw new PermissionDeniedError();
  }

  if (
    requirement.scope &&
    !scopes.includes("all") &&
    !scopes.includes(requirement.scope)
  ) {
    throw new PermissionDeniedError();
  }
}

export function createPermissions(
  grants: readonly { key: PermissionKey; scope: PermissionScope }[],
): EffectivePermissions {
  const permissions: EffectivePermissions = {};
  for (const grant of grants) {
    const current = permissions[grant.key] ?? [];
    permissions[grant.key] = Array.from(new Set([...current, grant.scope]));
  }
  return permissions;
}
