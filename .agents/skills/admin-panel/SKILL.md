---
name: admin-panel
description: Implement the Ardaş Turkish admin panel with bilingual CMS, direct editor publishing, MFA-secured access, explicit RBAC, career HR management, contact management, media, legal pages and audit.
---

# Admin Panel — Ardaş v0.3

## Required Reading

- `../../../docs/requirements/ADMIN_PANEL.md`
- `../../../docs/security/RBAC_MATRIX.md`
- `../../../docs/security/SECURITY_BASELINE.md`
- `../../../docs/security/AUDIT_POLICY.md`
- `../../../docs/architecture/DATA_MODEL.md`

## Production Authentication

MFA is mandatory.

Do not implement a production admin path that can bypass MFA.

## Roles

Use explicit permissions for:

- Super Admin
- Content Editor
- HR
- Contact Manager
- Viewer

## Publishing

v1:

- Content Editor may publish directly,
- no second approver required,
- revision/preview/rollback/scheduling/audit required.

## Contact

Only Contact Manager + Super Admin can access contact-message bodies by default.

## Career

Only HR + Super Admin can access candidate records/CVs by default.

## CV

Only clean-scanned protected PDFs can be downloaded.

Scanner pending/error → no download.

## Legal Pages

CMS can manage routes/content, but final legal wording must come from approved source.

## Completion

Admin work requires:

- MFA,
- positive/negative RBAC tests,
- locale publication states,
- audit,
- privacy-safe data handling.
