# Project Decision Log v0.3

## D-001 — Public Website Positioning
**Status:** Accepted

Corporate public site; not B2B/e-commerce/repair-shop/vehicle-showroom UI.

## D-002 — Design Direction
**Status:** Accepted

ABB-inspired restrained Swiss-corporate design language, adapted to Ardaş.

## D-003 — Technology Baseline
**Status:** Accepted

```text
Next.js
TypeScript
pnpm
PostgreSQL
```

Exact versions are selected before scaffold in Milestone 0.

## D-004 — Internationalization From Day One
**Status:** Accepted

TR/EN is foundational.

## D-005 — Localized Slugs
**Status:** Accepted

Stable route keys map to localized slugs.

## D-006 — Missing Translation Behavior
**Status:** Accepted

Direct request to unpublished locale variant returns 404.

Language switch goes to equivalent published route, otherwise target locale homepage.

## D-007 — Admin Language
**Status:** Accepted

Admin UI Turkish; managed public content bilingual.

## D-008 — Career Model
**Status:** Accepted

General application first; nullable `job_posting_id` reserved for future vacancy-specific applications.

## D-009 — Contact Form
**Status:** Accepted

Public contact form is in scope.

## D-010 — Security Before Career
**Status:** Accepted

Career submission cannot be production-enabled before auth/MFA/RBAC/protected storage/upload scanning/audit/retention gates pass.

## D-011 — Permission-Based RBAC
**Status:** Accepted

Server-side explicit permissions, not only role names.

## D-012 — Contact Manager Role
**Status:** Accepted

Contact messages are managed by `contact_manager` and `super_admin`.

Generic `viewer` and `content_editor` do not receive contact-message read access by default.

## D-013 — Dealer Portal
**Status:** Accepted

Validated site setting → environment fallback → disabled.

Only HTTPS; Super Admin-only update; audited.

## D-014 — Publishing Workflow v1
**Status:** Accepted

Authorized Content Editor may publish directly.

No mandatory second approver in v1.

Still required:

- preview,
- revisions,
- rollback,
- scheduled publication,
- locale-aware status,
- audit.

## D-015 — Environments
**Status:** Accepted

Local / staging / production are separate.

## D-016 — Career Required Fields
**Status:** Accepted

Required core fields:

- first name
- last name
- phone
- email
- department
- target location
- expected salary TRY
- availability/start date
- self-description
- CV

Approval-gated fields:

- gender
- birth date
- marital status
- military fields

## D-017 — CV Upload v1
**Status:** Accepted

```text
PDF only
Max 10 MB
Malware scan mandatory
Fail closed
```

Scanner unavailable/failure → file remains quarantined/inaccessible.

## D-018 — Admin MFA
**Status:** Accepted

MFA is mandatory for production admin access.

## D-019 — Department Model
**Status:** Accepted

Departments are managed entities:

```text
Department
DepartmentLocale
```

Not a hard-coded permanent enum.

## D-020 — Localized Media Accessibility
**Status:** Accepted

Use `MediaLocale` for localized alt text/caption.

Usage-specific alt override may be supported where semantic context differs.

## D-021 — Form Privacy Provenance
**Status:** Accepted

Career/contact records store:

- locale
- privacy notice version
- notice shown timestamp
- acknowledgement timestamp where applicable.

## D-022 — Slug History
**Status:** Accepted

Changed published slugs create a redirect-history record for permanent redirects.

## D-023 — Public Legal Pages
**Status:** Accepted

CMS/public routes include:

TR:
- `/tr/gizlilik`
- `/tr/cerez-politikasi`
- `/tr/kvkk`

EN:
- `/en/privacy`
- `/en/cookie-policy`
- `/en/data-protection`

Exact legal copy is approval-gated.

## D-024 — Audit Policy
**Status:** Accepted

Audit records are append-oriented, integrity-protected operational records.

Ordinary admins cannot edit/delete them.

Exact retention period is approval/operations decision before production.

## D-025 — Providers and Data Regions
**Status:** Accepted for architecture; provisioning/contracts TBD

Selected on 2026-08-18:

```text
Hosting: Vercel, Functions fra1 (Frankfurt)
PostgreSQL: Neon, AWS eu-central-1 (Frankfurt)
Object storage: Amazon S3, eu-central-1
Authentication/MFA: Auth0 EU tenant, MFA Always
Malware scanner: Amazon GuardDuty Malware Protection for S3, eu-central-1
Transactional email: Amazon SES, eu-central-1
Application monitoring: Sentry Germany region
AWS service monitoring: CloudWatch + EventBridge, eu-central-1
```

Public static assets may use Vercel's global CDN. Candidate/contact records,
CV objects and primary server execution use the selected EU regions.

Account provisioning, plan/cost approval, DPA/subprocessor review, legal data
transfer assessment, production owners and alert recipients remain `TBD` launch
gates. See ADR-009 and ADR-010.

## D-026 — Milestone 0 Toolchain Versions
**Status:** Accepted

Selected on 2026-08-18:

```text
Node.js: 24.19.0 LTS
pnpm: 11.22.0
Next.js: 16.3.1
React / React DOM: 19.2.8
TypeScript: 6.0.3
ESLint: 9.39.5
Vitest: 4.1.10
```

Versions are exact in project configuration and lockfile. Node.js and pnpm are
also pinned for CI. TypeScript 6 and ESLint 9 are the newest selected versions
inside the current Next.js lint toolchain's supported peer ranges.

## D-027 — PostgreSQL Data Access and Migrations
**Status:** Accepted

Use Drizzle ORM `0.45.2` with Drizzle Kit `0.31.10` and PostgreSQL.

Reasons:

- type-safe server-side data access,
- committed and reviewable SQL migration history,
- PostgreSQL support without coupling production runtime to a schema CLI,
- explicit SQL visibility for data and security constraints,
- small server runtime surface.

Prisma ORM 7.9.1 was evaluated first but rejected because its optional CLI peer
was resolved into the production dependency graph and carried an unresolved
high-severity transitive advisory at selection time. A major-version override
was not accepted as a safe production baseline.

Database schema and initial Drizzle migration are delivered in Milestone 1.

## D-028 — PostgreSQL Version and Migration Contract
**Status:** Accepted

Use PostgreSQL 18. The reproducible local/CI baseline is the official
`postgres:18.4` image; Neon manages supported production minor updates.

The schema lives in `src/db/schema.ts`; generated SQL and Drizzle metadata are
committed under `drizzle/`. CI must apply migrations to a clean database, run DB
tests, regenerate metadata without a Git diff, and pass dependency audit.

## D-029 — Locale-Owned Data and Publication
**Status:** Accepted

Stable parent IDs and route keys are language-neutral. Localized rows own
localized slugs/content and their own `draft | published | archived` lifecycle,
including publish/schedule/archive timestamps. Missing or unpublished direct
locale access is unavailable/404; only the language switch may fall back to the
target locale homepage.

## D-030 — Storage Classes and Scan State
**Status:** Accepted

`Media.storage_class` is one of `public | protected | quarantine`.
`Media.scan_status` is one of `pending | clean | infected | error`.

Amazon GuardDuty results map to the internal state. `UNSUPPORTED`,
`ACCESS_DENIED`, `FAILED`, timeout and scanner unavailability map to fail-closed
behavior. A protected media row requires `clean` at database level.

## D-031 — Site Settings Exclude Secrets
**Status:** Accepted

`SiteSetting` accepts only the explicit non-secret `site_setting_key` allowlist.
Provider credentials, authentication secrets, tokens, private keys and database
URLs remain environment/secret-manager values and cannot be general CMS rows.

## D-032 — Milestone 2 Admin Security Boundary
**Status:** Accepted

Auth0's immutable `sub` claim is the unique external identity bound to an active
local `AdminUser`. A valid Auth0 session alone does not grant application access.
Production admin access fails closed unless the verified session's standard
`amr` claim contains `mfa`; protected CV download requires this MFA evidence in
every environment.

Roles only group grants. Runtime authorization reads atomic permission keys and
optional scopes from PostgreSQL and never branches on a role name. The v0.3
catalog is seeded by migration; `all`, `content`, `public_locale`, `recruitment`
and `retention` scopes encode limited matrix cells.

Dealer Portal values reject HTTP, credentials, query strings, fragments and
non-443 explicit ports. An optional exact hostname allowlist is enforced before
the setting or environment fallback can be enabled.

## D-033 — GuardDuty Event Delivery and Retry
**Status:** Accepted for application architecture; AWS provisioning TBD

GuardDuty Malware Protection scan results travel through EventBridge to a
private SQS queue. The application polls with AWS-authenticated SDK calls; there
is no public scan-result webhook. Provider event IDs are unique/idempotent.

`NO_THREATS_FOUND` alone may copy a CV from quarantine to protected storage.
All other results, missing events, timeout and promotion errors remain
quarantined/inaccessible. Timed-out/error objects are re-keyed as new quarantine
objects for at most three scan attempts with bounded backoff; every failure emits
a PII-safe operational alert signal. Queue/DLQ, IAM, bucket policy, GuardDuty
tagging and production alarm provisioning remain deployment gates.

## D-034 — Abuse Control and Retention Execution
**Status:** Accepted

Career/contact abuse control uses atomic PostgreSQL fixed-window buckets. Client
identifiers are stored only as HMAC-SHA-256 values using a server secret; raw IP
or form values are not persisted in rate-limit rows or logs.

Retention duration has no invented default. Candidate/contact deadlines and
optional holds drive an authenticated internal cleanup job. Anonymization clears
personal/free-text fields and deletes CV objects; database checks allow nullable
required fields only after `anonymized_at` is set. Approved duration values remain
configurable/TBD before production form enablement.
