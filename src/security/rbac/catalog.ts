export const roleKeys = [
  "super_admin",
  "content_editor",
  "hr",
  "contact_manager",
  "viewer",
] as const;

export type RoleKey = (typeof roleKeys)[number];

export const permissionScopes = [
  "all",
  "content",
  "public_locale",
  "recruitment",
  "retention",
] as const;

export type PermissionScope = (typeof permissionScopes)[number];

export const permissionKeys = [
  "Dashboard:view",
  "Pages:view",
  "Pages:create",
  "Pages:edit",
  "Pages:preview",
  "Pages:publish",
  "Pages:schedule",
  "Pages:archive",
  "Pages:rollback",
  "Brands:view",
  "Brands:create",
  "Brands:edit",
  "Brands:publish",
  "ProductGroups:view",
  "ProductGroups:create",
  "ProductGroups:edit",
  "ProductGroups:publish",
  "Locations:view",
  "Locations:create",
  "Locations:edit",
  "Locations:publish",
  "Departments:view",
  "Departments:create",
  "Departments:edit",
  "Media:view-public",
  "Media:upload-public",
  "Media:delete-public",
  "CareerContent:view",
  "CareerContent:edit",
  "CareerContent:publish",
  "Applications:view",
  "Applications:status",
  "Applications:notes",
  "Applications:cv-download",
  "Applications:delete",
  "Applications:anonymize",
  "Contact:view",
  "Contact:update-status",
  "Contact:internal-note",
  "Contact:delete",
  "LegalPages:view",
  "LegalPages:edit",
  "LegalPages:publish",
  "SEO:view",
  "SEO:edit",
  "SEO:publish",
  "SiteSettings:view",
  "SiteSettings:edit-general",
  "DealerPortal:update",
  "Users:view",
  "Users:create",
  "Users:edit",
  "Users:disable",
  "Roles:assign",
  "Audit:view-global",
  "Audit:view-career-scope",
  "Audit:view-contact-scope",
  "Audit:export",
] as const;

export type PermissionKey = (typeof permissionKeys)[number];

export interface PermissionGrant {
  key: PermissionKey;
  scope: PermissionScope;
}

const grant = (
  keys: readonly PermissionKey[],
  scope: PermissionScope = "all",
): PermissionGrant[] => keys.map((key) => ({ key, scope }));

const contentEditor = [
  ...grant([
    "Dashboard:view",
    "Pages:view",
    "Pages:create",
    "Pages:edit",
    "Pages:preview",
    "Pages:publish",
    "Pages:schedule",
    "Pages:archive",
    "Pages:rollback",
    "Brands:view",
    "Brands:create",
    "Brands:edit",
    "Brands:publish",
    "ProductGroups:view",
    "ProductGroups:create",
    "ProductGroups:edit",
    "ProductGroups:publish",
    "Locations:view",
    "Locations:create",
    "Locations:edit",
    "Locations:publish",
    "Departments:view",
    "Media:view-public",
    "Media:upload-public",
    "Media:delete-public",
    "CareerContent:view",
    "CareerContent:edit",
    "CareerContent:publish",
    "LegalPages:view",
    "LegalPages:edit",
    "LegalPages:publish",
    "SEO:view",
    "SEO:edit",
    "SEO:publish",
    "SiteSettings:view",
  ]),
  ...grant(["SiteSettings:edit-general"], "content"),
  ...grant(["Departments:create", "Departments:edit"], "public_locale"),
] as const;

const hr = [
  ...grant([
    "Dashboard:view",
    "Pages:view",
    "Brands:view",
    "ProductGroups:view",
    "Locations:view",
    "Departments:view",
    "CareerContent:view",
    "CareerContent:edit",
    "CareerContent:publish",
    "Applications:view",
    "Applications:status",
    "Applications:notes",
    "Applications:cv-download",
    "LegalPages:view",
    "SEO:view",
    "SiteSettings:view",
    "Audit:view-career-scope",
  ]),
  ...grant(["Departments:create", "Departments:edit"], "recruitment"),
  ...grant(["Media:view-public", "Media:upload-public"], "recruitment"),
  ...grant(["Applications:delete", "Applications:anonymize"], "retention"),
] as const;

const contactManager = [
  ...grant([
    "Dashboard:view",
    "Pages:view",
    "Contact:view",
    "Contact:update-status",
    "Contact:internal-note",
    "LegalPages:view",
    "SiteSettings:view",
    "Audit:view-contact-scope",
  ]),
  ...grant(["Contact:delete"], "retention"),
] as const;

const viewer = grant([
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
]);

export const rolePermissionGrants: Readonly<
  Record<RoleKey, readonly PermissionGrant[]>
> = {
  super_admin: grant(permissionKeys),
  content_editor: contentEditor,
  hr,
  contact_manager: contactManager,
  viewer,
};

export const roleDisplayNames: Readonly<Record<RoleKey, string>> = {
  super_admin: "Super Admin",
  content_editor: "İçerik Editörü",
  hr: "İnsan Kaynakları",
  contact_manager: "İletişim Yöneticisi",
  viewer: "Görüntüleyici",
};

export function splitPermissionKey(key: PermissionKey) {
  const separator = key.indexOf(":");
  return {
    resource: key.slice(0, separator),
    action: key.slice(separator + 1),
  };
}

export function isPermissionKey(value: string): value is PermissionKey {
  return permissionKeys.some((permission) => permission === value);
}
