# File Upload Security — CV & Media v0.3

## CV Policy v1

Allowed:

```text
PDF only
```

Maximum:

```text
10 MB
```

## Mandatory Validation

1. Request size check.
2. Expected upload field check.
3. Random internal storage key.
4. `.pdf` extension allowlist.
5. MIME validation.
6. PDF magic/signature validation.
7. Reject malformed/polyglot/suspicious files where validator/scanner detects them.
8. Store in quarantine.
9. Mandatory malware scan.
10. Only clean files become downloadable to authorized HR/Super Admin.
11. Safe metadata only.

Browser MIME is never authoritative.

## Fail-Closed Scanner

Production behavior:

```text
scanner unavailable
OR scan error
OR scan timeout
→ quarantine remains
→ file inaccessible
→ retry/operational alert
```

No fail-open mode for CVs.

## Storage

CVs are never placed in public static folders/CDN-public buckets.

Production uses separate `eu-central-1` public, quarantine and protected S3
buckets. Enable encryption at rest, block public access on quarantine/protected,
version/lifecycle rules consistent with approved retention, access logging where
approved and least-privilege IAM. The application identity may write quarantine,
promote/delete protected files and manage only its required public-media prefix;
it must not administer bucket policy or unrelated objects.

## GuardDuty Event Flow

```text
upload
→ quarantine S3
→ GuardDuty Malware Protection for S3
→ EventBridge rule
→ SQS queue
→ application processor
→ clean/protected OR inaccessible quarantine
```

Provision bounded retry, a DLQ, queue-age/backlog alarms and alerts for infected,
unsupported, access-denied, failed, timeout and protected-promotion failure. Event
handling is idempotent. Missing/invalid/provider-error results never promote or
expose a file. AWS resource identifiers and alarm destinations remain
`BLOCKED_EXTERNAL` and must not be invented in source.

## Download

Requires:

- authenticated session,
- MFA-authenticated admin context,
- `Applications:cv-download`,
- valid application/file relationship,
- clean scan status.

## Audit

Protected CV download may generate access audit according to policy.

## Public Media

Public image/video upload is a separate storage class.

Validate:

- allowlisted format,
- size,
- dimensions,
- decodeability,
- metadata,
- focal point.

## Localized Accessibility

Alt/caption metadata uses `MediaLocale`.

A semantic usage override may be provided per placement when the same image conveys different meaning in different contexts.
