import { describe, expect, it } from "vitest";

import {
  permissionKeys,
  roleKeys,
  rolePermissionGrants,
  type PermissionKey,
  type RoleKey,
} from "../../src/security/rbac/catalog";
import {
  assertAuthorized,
  createPermissions,
  type AdminPrincipal,
} from "../../src/security/rbac/authorization";

const allowed: Record<RoleKey, readonly PermissionKey[]> = {
  super_admin: permissionKeys,
  content_editor: permissionKeys.filter((key) =>
    /^(?:Dashboard|Pages|Brands|ProductGroups|Locations|Departments|Media|CareerContent|LegalPages|SEO|SiteSettings):/.test(
      key,
    ),
  ),
  hr: [
    "Dashboard:view",
    "Pages:view",
    "Brands:view",
    "ProductGroups:view",
    "Locations:view",
    "Departments:view",
    "Departments:create",
    "Departments:edit",
    "Media:view-public",
    "Media:upload-public",
    "CareerContent:view",
    "CareerContent:edit",
    "CareerContent:publish",
    "Applications:view",
    "Applications:status",
    "Applications:notes",
    "Applications:cv-download",
    "Applications:delete",
    "Applications:anonymize",
    "LegalPages:view",
    "SEO:view",
    "SiteSettings:view",
    "Audit:view-career-scope",
  ],
  contact_manager: [
    "Dashboard:view",
    "Pages:view",
    "Contact:view",
    "Contact:update-status",
    "Contact:internal-note",
    "Contact:delete",
    "LegalPages:view",
    "SiteSettings:view",
    "Audit:view-contact-scope",
  ],
  viewer: [
    "Dashboard:view",
    "Pages:view",
    "Pages:preview",
    "Brands:view",
    "ProductGroups:view",
    "Locations:view",
    "Departments:view",
    "Media:view-public",
    "CareerContent:view",
    "LegalPages:view",
    "SEO:view",
    "SiteSettings:view",
  ],
};

function principal(role: RoleKey, mfaAuthenticated = true): AdminPrincipal {
  return {
    userId: "00000000-0000-4000-8000-000000000001",
    auth0Subject: "auth0|test",
    mfaAuthenticated,
    permissions: createPermissions(rolePermissionGrants[role]),
  };
}

describe("permission RBAC", () => {
  it("matches every positive and negative cell in the expanded v0.3 matrix", () => {
    for (const role of roleKeys) {
      const actual = new Set(rolePermissionGrants[role].map(({ key }) => key));
      const expected = new Set(allowed[role]);
      for (const permission of permissionKeys) {
        expect(
          actual.has(permission),
          `${role} / ${permission}`,
        ).toBe(expected.has(permission));
      }
    }
  });

  it("enforces the named cross-domain denials", () => {
    for (const role of ["viewer", "content_editor"] as const) {
      expect(() =>
        assertAuthorized(principal(role), { permission: "Contact:view" }),
      ).toThrowError("permission_denied");
    }
    for (const permission of [
      "Applications:view",
      "Applications:cv-download",
    ] as const) {
      expect(() =>
        assertAuthorized(principal("content_editor"), { permission }),
      ).toThrowError("permission_denied");
    }
    for (const permission of [
      "DealerPortal:update",
      "SiteSettings:edit-general",
    ] as const) {
      expect(() =>
        assertAuthorized(principal("hr"), { permission }),
      ).toThrowError("permission_denied");
    }
    expect(() =>
      assertAuthorized(principal("contact_manager"), {
        permission: "Applications:view",
      }),
    ).toThrowError("permission_denied");

    for (const permission of [
      "Pages:publish",
      "Users:view",
      "Roles:assign",
    ] as const) {
      expect(() =>
        assertAuthorized(principal("contact_manager"), { permission }),
      ).toThrowError("permission_denied");
    }
    for (const permission of ["Users:view", "Roles:assign", "Contact:view"] as const) {
      expect(() =>
        assertAuthorized(principal("hr"), { permission }),
      ).toThrowError("permission_denied");
    }
    for (const permission of permissionKeys.filter((key) =>
      /:(?:create|edit|publish|schedule|archive|rollback|upload-public|delete-public|status|notes|cv-download|delete|anonymize|update-status|internal-note|edit-general|update|assign|export)$/.test(key),
    )) {
      expect(() =>
        assertAuthorized(principal("viewer"), { permission }),
      ).toThrowError("permission_denied");
    }
  });

  it("enforces limited scopes without consulting role names", () => {
    const editor = principal("content_editor");
    expect(() =>
      assertAuthorized(editor, {
        permission: "Departments:edit",
        scope: "public_locale",
      }),
    ).not.toThrow();
    expect(() =>
      assertAuthorized(editor, {
        permission: "Departments:edit",
        scope: "recruitment",
      }),
    ).toThrowError("permission_denied");
    expect(() =>
      assertAuthorized(principal("hr"), {
        permission: "Applications:anonymize",
        scope: "retention",
      }),
    ).not.toThrow();
  });

  it("denies anonymous access and requires MFA in production", () => {
    expect(() =>
      assertAuthorized(null, { permission: "Dashboard:view" }),
    ).toThrowError("authentication_required");
    expect(() =>
      assertAuthorized(principal("viewer", false), {
        permission: "Dashboard:view",
        environment: "production",
      }),
    ).toThrowError("mfa_required");
    expect(() =>
      assertAuthorized(principal("hr", false), {
        permission: "Applications:cv-download",
        requireMfa: true,
      }),
    ).toThrowError("mfa_required");
  });
});
