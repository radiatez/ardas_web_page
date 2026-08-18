# Logging & Monitoring

## Principles

Logs support operations without becoming a second personal-data database.

## Never Log

- passwords,
- session tokens,
- auth secrets,
- CV content,
- full candidate about-text,
- full salary/phone/email values,
- contact message bodies,
- storage credentials.

## Prefer

- correlation ID,
- record ID,
- event type,
- status/result,
- duration,
- safe error code.

## Monitoring

Monitor:

- 5xx rates,
- form error rates,
- email notification failures,
- upload scanner/quarantine failures,
- admin login abuse,
- protected download anomalies,
- database/storage health,
- backup failures,
- Core Web Vitals where available.

## Security Events

Track:

- repeated failed login,
- role changes,
- privileged settings changes,
- unusual protected-file access,
- repeated rejected uploads.

## Alerting

Define production alert destinations/provider during infrastructure selection.

Alerts should not embed raw PII.

## v0.3 Additional Monitoring

Monitor:

- malware scanner availability/queue age,
- quarantined CV backlog,
- MFA failures/resets,
- email sender reputation/delivery failures,
- unexpected slug redirect loops.
