# Audit Log Policy

## Purpose

Audit records provide traceability for privileged/security/privacy-sensitive actions.

## Integrity

Audit events are append-oriented.

Ordinary admin roles cannot edit or delete audit records.

Prefer:

- immutable/append-only table semantics,
- restricted DB permissions,
- periodic backup/export,
- integrity checks where provider supports them.

## Events

At minimum:

- admin login/security events,
- MFA enrollment/reset/security change,
- user enable/disable,
- role assignment,
- publish/archive/rollback/schedule,
- Dealer Portal URL change,
- application status change,
- CV protected download,
- candidate delete/anonymize,
- contact delete/retention action,
- legal-page publish,
- high-risk site-setting change.

## Data Minimization

Audit metadata must not duplicate full PII.

Use:

- IDs,
- event type,
- actor,
- timestamp,
- safe old/new metadata.

Do not store:

- CV contents,
- candidate free text,
- full contact message,
- passwords/tokens.

## Retention

Exact audit retention period is TBD before production.

It must be longer than ordinary content operational history where business/security policy requires, but must be explicitly approved and documented.

## Access

- Super Admin: global audit
- HR: career-scoped audit only
- Contact Manager: contact-scoped audit only
- others: no sensitive audit access

## Export

Audit export is privileged and itself auditable.
