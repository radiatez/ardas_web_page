# Security Baseline v0.3

## Admin Authentication

Production requirements:

- no public registration,
- secure sessions,
- account revocation,
- rate limiting,
- **MFA mandatory for every admin role**.

## Authorization

- explicit permission RBAC,
- server-side enforcement,
- deny by default.

## Input Validation

All mutations:

- server schema validation,
- max lengths,
- enum/entity validation,
- numeric bounds,
- safe output encoding.

## Secrets

- never in repo,
- never in client bundle,
- use secret/environment management,
- rotation procedure: `INCIDENT_RESPONSE.md`.

## Uploads

CV:

```text
PDF only
10 MB
mandatory malware scan
fail closed
```

See:

`FILE_UPLOAD_SECURITY.md`

## Dealer Portal URL

- HTTPS only,
- validated server-side,
- optional host allowlist,
- Super Admin-only change,
- audit old/new value.

## Rate Limits

At minimum:

- admin login,
- career,
- contact,
- privileged download abuse controls where appropriate.

## Web Security

- CSRF/origin protection according to session architecture,
- default output escaping,
- sanitize approved rich HTML,
- per-request cryptographic CSP nonce forwarded through the App Router and Auth0,
- `script-src` nonce + `strict-dynamic`; no `unsafe-inline`/`unsafe-eval`,
- `style-src` nonce plus only the documented exact Next Image attribute hash,
- same-origin `connect-src`; validated HTTPS public-media origin only where configured,
- `object-src 'none'`, `frame-src 'none'`, `frame-ancestors 'none'`, bounded
  `base-uri` and `form-action`,
- HSTS,
- X-Content-Type-Options,
- Referrer-Policy,
- frame-ancestor protection,
- appropriate Permissions-Policy,
- private/no-store for admin, preview, auth, API and isolated test surfaces.

Framework or Auth0 upgrades must rerun the CSP browser matrix. Do not replace a
failed hash/nonce contract with a broad inline allowance.

## Logging

PII-safe structured logs.

## Error States

Localized safe:

- 404,
- 500,
- maintenance/unavailable.

No stack trace in public responses.

## Incident Response

See:

`INCIDENT_RESPONSE.md`

## Audit

See:

`AUDIT_POLICY.md`
