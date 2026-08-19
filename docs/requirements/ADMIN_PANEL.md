# Admin Panel Requirements v0.3

## Language

Admin UI:

```text
Turkish
```

Managed public content:

```text
Turkish + English
```

## Production Authentication

Mandatory:

- no public registration,
- secure session management,
- server-side auth,
- server-side permissions,
- MFA for all admin users,
- login abuse protection,
- account disable/revocation.

## Roles

- Super Admin
- Content Editor
- HR
- Contact Manager
- Viewer

Authoritative permissions:

`../security/RBAC_MATRIX.md`

## Publishing v1

Authorized Content Editor can:

- create,
- edit,
- preview,
- publish,
- schedule,
- archive,
- rollback

within public content scope.

No mandatory second approver in v1.

All material changes remain revisioned/audited.

## Modules

1. Dashboard
2. Homepage
3. Corporate pages
4. Brands
5. Product groups
6. Locations
7. Departments
8. Careers / job postings
9. Job applications
10. Contact submissions
11. Media library
12. Legal pages
13. SEO
14. Site settings
15. Users / roles
16. Audit log
17. Revision/history

## Contact Messages

Default access:

- Super Admin
- Contact Manager

No generic Content Editor or Viewer message-body access.

## Candidate Applications

Default access:

- Super Admin
- HR

Content Editor, Contact Manager and Viewer have no candidate/CV access. The
server-paginated list shows only operational minimum fields; phone, email,
salary, free text, privacy provenance, notes and history are detail-only.

Status, notes, CV download, anonymization and delete use their individual
`Applications:*` permissions. CV download additionally requires MFA, a valid
application/file relationship, protected storage and a clean scan. HR retention
scope cannot bypass a future deadline or active hold; early override/hard delete
requires `all` scope.

## Legal Pages

CMS supports legal-page records/routes, but publishing final legal copy requires approved company text.

## Site Settings

At minimum:

- display name
- company stats
- contact/footer data
- social links
- default SEO
- Dealer Portal URL
- approved retention values
- notification recipients (non-secret configuration)
- content-owner metadata if stored centrally

Secrets remain outside general CMS settings.

## Dealer Portal

- Super Admin only
- HTTPS only
- validated host policy
- audited old/new values
- environment fallback

## Audit

See:

`../security/AUDIT_POLICY.md`
