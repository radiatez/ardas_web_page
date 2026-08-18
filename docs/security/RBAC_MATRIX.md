# RBAC Permission Matrix v0.3

## Roles

- `super_admin`
- `content_editor`
- `hr`
- `contact_manager`
- `viewer`

Permissions are server-enforced.

Legend:

```text
✓ allowed
R read-only
L limited/scoped
— denied
```

| Permission | Super Admin | Content Editor | HR | Contact Manager | Viewer |
|---|---:|---:|---:|---:|---:|
| Dashboard:view | ✓ | ✓ | ✓ | ✓ | R |
| Pages:view | ✓ | ✓ | R | R | R |
| Pages:create | ✓ | ✓ | — | — | — |
| Pages:edit | ✓ | ✓ | — | — | — |
| Pages:preview | ✓ | ✓ | — | — | R |
| Pages:publish | ✓ | ✓ | — | — | — |
| Pages:schedule | ✓ | ✓ | — | — | — |
| Pages:archive | ✓ | ✓ | — | — | — |
| Pages:rollback | ✓ | ✓ | — | — | — |
| Brands:view | ✓ | ✓ | R | — | R |
| Brands:create/edit/publish | ✓ | ✓ | — | — | — |
| ProductGroups:view | ✓ | ✓ | R | — | R |
| ProductGroups:create/edit/publish | ✓ | ✓ | — | — | — |
| Locations:view | ✓ | ✓ | R | — | R |
| Locations:create/edit/publish | ✓ | ✓ | — | — | — |
| Departments:view | ✓ | ✓ | ✓ | — | R |
| Departments:create/edit | ✓ | L | ✓ | — | — |
| Media:view-public | ✓ | ✓ | L | — | R |
| Media:upload-public | ✓ | ✓ | L | — | — |
| Media:delete-public | ✓ | ✓ | — | — | — |
| CareerContent:view | ✓ | ✓ | ✓ | — | R |
| CareerContent:edit/publish | ✓ | ✓ | ✓ | — | — |
| Applications:view | ✓ | — | ✓ | — | — |
| Applications:status | ✓ | — | ✓ | — | — |
| Applications:notes | ✓ | — | ✓ | — | — |
| Applications:cv-download | ✓ | — | ✓ | — | — |
| Applications:delete/anonymize | ✓ | — | L | — | — |
| Contact:view | ✓ | — | — | ✓ | — |
| Contact:update-status | ✓ | — | — | ✓ | — |
| Contact:internal-note | ✓ | — | — | ✓ | — |
| Contact:delete | ✓ | — | — | L | — |
| LegalPages:view | ✓ | ✓ | R | R | R |
| LegalPages:edit | ✓ | ✓ | — | — | — |
| LegalPages:publish | ✓ | ✓ | — | — | — |
| SEO:view | ✓ | ✓ | R | — | R |
| SEO:edit/publish | ✓ | ✓ | — | — | — |
| SiteSettings:view | ✓ | R | R | R | R |
| SiteSettings:edit-general | ✓ | L | — | — | — |
| DealerPortal:update | ✓ | — | — | — | — |
| Users:view | ✓ | — | — | — | — |
| Users:create/edit/disable | ✓ | — | — | — | — |
| Roles:assign | ✓ | — | — | — | — |
| Audit:view-global | ✓ | — | — | — | — |
| Audit:view-career-scope | ✓ | — | L | — | — |
| Audit:view-contact-scope | ✓ | — | — | L | — |
| Audit:export | ✓ | — | — | — | — |

## Limited Rules

### Department Management

HR may manage recruitment-facing departments if product policy allows.

Content Editor may manage translated public labels/descriptions but not protected HR-only metadata.

### Career Deletion/Anonymization

HR may execute approved retention workflow; policy override/legal hold is Super Admin controlled.

### Contact Delete

Contact Manager may archive/execute approved retention workflow; destructive override is Super Admin controlled.

### Viewer

Viewer never sees:

- contact message bodies,
- candidate/application data,
- protected CVs,
- sensitive audit logs.

## Enforcement

Check permissions in:

- server actions,
- API/route handlers,
- page loaders/server components,
- protected file endpoints.

UI visibility mirrors permissions but is not authorization.

## MFA

All roles with admin access require MFA in production.

## Testing

Positive and negative permission tests are mandatory.
