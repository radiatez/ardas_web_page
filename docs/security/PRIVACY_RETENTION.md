# Privacy, Retention & Personal Data Technical Policy v0.3

> Technical requirements only; not final legal/KVKK wording.

## Launch-Gated Values

Before production approve:

```text
CANDIDATE_RETENTION_DAYS
CONTACT_RETENTION_DAYS
AUDIT_RETENTION_DAYS
```

No indefinite default.

## Candidate Record Provenance

Store:

- locale
- privacy_notice_version
- privacy_notice_shown_at
- privacy_acknowledged_at where applicable

The current UI wording is acknowledgement of reading, not explicit consent.
The same distinction applies to contact records.

## Contact Record Provenance

Store equivalent fields.

## Retention

Candidate/contact records support:

- `retention_due_at`,
- scheduled cleanup,
- deletion/anonymization,
- manual approved workflow,
- audit,
- legal/operational hold if required later.

## CV

CV lifecycle follows candidate record policy.

Deletion/anonymization workflow must remove protected CV according to approved retention.

## Data Request Workflow

Architecture should support:

- locate,
- verify through company process,
- view/export where required,
- correct,
- delete/anonymize,
- audit action.

## Logs

Do not log full PII.

## Backups

Deletion from active systems occurs by policy; backup retention is separately documented.

After restore, reapply retention cleanup.

## Data Regions

Document before production:

- DB region,
- object storage region,
- backup region,
- email/monitoring processors.

## Legal Copy

Legal/privacy text and the short career/contact notices live in versioned CMS
content. Temporary `TEMP-2026-08-V1` content is review-required and may support
non-production review, but production form enablement fails closed until the
active notice has a new approved version and approval reference. New wording is
a new immutable revision/version; historic submission provenance is retained.
