# Domain, DNS & Email Operations

## Before Production

Document:

```text
PUBLIC_DOMAIN
STAGING_DOMAIN
DNS_PROVIDER
EMAIL_SENDER_DOMAIN
CONTACT_NOTIFICATION_RECIPIENT
HR_NOTIFICATION_RECIPIENT
```

## DNS

Maintain records for:

- application hosting,
- staging if public,
- verification records,
- email authentication.

## Transactional Email

Configure:

- SPF
- DKIM
- DMARC
- verified sender address/domain
- bounce/failure visibility
- retry/queue behavior

Examples of notification flows:

- career application received → HR recipient
- contact message received → Contact Manager recipient

Application/message persistence remains authoritative if email fails.

## Secrets

Email provider API keys are secrets and not CMS fields.

## Domain Cutover

Before launch:

- DNS TTL plan,
- SSL/TLS verified,
- canonical domain set,
- redirect behavior tested,
- rollback path documented.

## Monitoring

Alert on:

- email delivery failures,
- provider authentication failures,
- DNS/SSL expiry problems where tooling supports it.
