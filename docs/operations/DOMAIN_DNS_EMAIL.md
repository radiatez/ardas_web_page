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

All values remain `BLOCKED_EXTERNAL`; none may be inferred from the temporary
Dealer Portal host or repository metadata.

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
- SES production-access/suppression and bounce/complaint behavior
- scheduled outbox worker authentication/invocation

Examples of notification flows:

- career application received → HR recipient
- contact message received → Contact Manager recipient

Application/message persistence remains authoritative if email fails.
Notification payloads contain record identifiers and safe event context only.

## Secrets

Email provider API keys are secrets and not CMS fields.

## Domain Cutover

Before launch:

- DNS TTL plan,
- SSL/TLS verified,
- canonical domain set,
- redirect behavior tested,
- rollback path documented.

Set `SITE_URL` and `APP_BASE_URL` to the verified canonical HTTPS origin. Update
Auth0 callback/logout/allowed-origin values at the same cutover. Validate `/`
locale redirect, canonical/hreflang, sitemap and HTTP-to-HTTPS behavior before
reducing DNS TTL recovery options.

## Monitoring

Alert on:

- email delivery failures,
- provider authentication failures,
- DNS/SSL expiry problems where tooling supports it.
