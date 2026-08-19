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

Application security failures emit structured error events suitable for the
selected Sentry Germany integration. GuardDuty/S3/SQS service alarms use
CloudWatch/EventBridge. Exact production projects, destinations and on-call
recipients remain `TBD` until infrastructure provisioning.

Alerts should not embed raw PII.

The implemented sanitizer recursively redacts sensitive field names, email,
phone, bearer/JWT-like values, form bodies, filenames and CV content before a
structured record reaches the output sink. Record IDs and safe status/error codes
remain available for correlation.

## v0.3 Additional Monitoring

Monitor:

- malware scanner availability/queue age,
- quarantined CV backlog,
- MFA failures/resets,
- email sender reputation/delivery failures,
- unexpected slug redirect loops.

## Milestone 8 Performance Baseline

Production-build Chromium lab regression on 2026-08-19 recorded:

```text
CLS: 0
LCP: 136 ms
Transferred JavaScript: 150,554 bytes
```

The automated guard limits CLS to `0.10`, LCP to `2.5 s` and delivered JS to
`500,000 bytes`. These local values are diagnostic, not production field p75 and
do not prove INP. Vercel field telemetry plus approved monitoring must establish
LCP/INP/CLS p75 after staging/production provisioning. Alert destinations,
sample rates, Sentry/CloudWatch configuration and provider-side PII scrubbing
remain Milestone 9 gates.
