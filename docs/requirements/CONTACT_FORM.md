# Public Contact Form Requirements v0.3

## Routes

```text
/tr/iletisim
/en/contact
```

## Fields

Required:

- Name Surname
- Email
- Subject
- Message

Optional:

- Company
- Phone

## Privacy Provenance

Store:

```text
locale
privacy_notice_version
privacy_notice_shown_at
privacy_acknowledged_at nullable/according to approved wording
```

## Validation

Client for UX; server authoritative.

Enforce:

- max lengths,
- normalized email,
- input trimming,
- request-size limits,
- unexpected-field rejection where practical.

## Abuse Protection

- rate limiting,
- honeypot,
- request-size limit,
- optional challenge when abuse requires it.

## Persistence

Accepted message is stored before notification.

Email/provider failure must not lose the message.

## Admin Access

Only roles/permissions explicitly granted in `RBAC_MATRIX.md`.

Default:

- Super Admin
- Contact Manager

Content Editor and Viewer do not read contact-message bodies by default.

## Status

```text
New
Read
Replied
Archived
```

## Retention

Configurable; exact duration launch-gated.

See:

`../security/PRIVACY_RETENTION.md`
