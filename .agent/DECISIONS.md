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

## D-035 — Milestone 3 Public Design System Boundary
**Status:** Accepted; final brand identity remains TBD

The public shell uses project-owned CSS custom-property tokens and small
Next.js/React primitives instead of adopting a UI library aesthetic. The system
is mobile-first with 4/8/12-column grid contracts, architectural 0–4 px radii,
border/surface hierarchy instead of card shadows, and reduced-motion fallbacks.

Until the final brand identity is approved:

- `ARDAŞ` is a replaceable text-wordmark component, not a final logo asset,
- `#0057B8` is a provisional accessible accent token, not an approved brand color,
- the Helvetica/Arial-compatible system stack is a replaceable font token, not
  the approved corporate typeface.

The public shell remains server-first. Only the mobile focus-managed menu and
pathname-aware locale switch require client JavaScript. Dealer Portal UI receives
the existing server-side `SiteSetting → environment → disabled` resolution and
never contains a configured URL. The development showcase is unlinked, `noindex`,
and returns 404 in production.

## D-036 — Published Public Content Rendering Contract
**Status:** Accepted; production content remains approval-gated

Public pages render server-side from the existing neutral `Page` route key and
locale-owned `PageLocale` row. `content_json` uses a bounded, versioned
`schemaVersion: 1` editorial-block contract. The renderer accepts known text,
internal route-key actions and UUID media references only; it does not render raw
HTML, arbitrary component names or editor-supplied external URLs.

The public boundary is:

- the requested `PageLocale` must be `published`, within its publication window
  and use the registered localized slug,
- collections include only active parents with a published requested-locale row,
- public imagery requires `Media.storage_class = public`, a published matching
  `MediaLocale`, dimensions, an HTTPS `PUBLIC_MEDIA_BASE_URL`, and localized alt
  text unless the editorial block explicitly marks it decorative,
- local/test may use clearly labelled `TBD` placeholder documents; staging and
  production never fall back to placeholder content,
- placeholder pages are `noindex`; the sitemap contains CMS-published pages only,
- canonical, hreflang and social metadata advertise only published locale
  variants,
- language switching resolves publication server-side and falls back to the
  target locale homepage when the equivalent is unavailable.

The contract is compatible with the existing `ContentRevision` snapshots and
the Milestone 6 preview/publish/rollback work. CMS authoring validation and
preview UI remain Milestone 6 scope.

## D-037 — Milestone 4.1 Demo Media and Provisional Accent
**Status:** Accepted for local/test visual prototyping; final identity/media remain TBD

The provisional public accent is refined from the Milestone 3 blue to
desaturated petrol `#006B63` (`#004C47` hover, `#E4F0EE` soft). It remains a
replaceable token and is not final brand approval. The choice supports the
industrial/automotive art direction without using ABB red or copying ABB's
identity; its white-background contrast passes WCAG AA.

Six generated industrial editorial images form a coherent local/test demo set:
warehouse hero, distribution operation, parts detail, loading facility,
workplace/careers and an abstract portfolio rhythm. They contain no intended
brands, logos, readable labels, certifications or invented company claims.

The assets are not inserted into PostgreSQL or treated as approved CMS media.
`src/content/demo-media.ts` mirrors the public `Media` / `MediaLocale`
presentation contract with stable demo IDs, TR/EN alt text, decorative semantics
and focal points. It is loaded only through the existing development-content
gate; staging/production still require published CMS media resolved from secure
public storage. Final approved photography replaces these files before launch.

## D-038 — Milestone 6 CMS Working Copy and Publication Boundary
**Status:** Accepted

Published localized rows remain the public source while an editor works. A
generic `ContentDraft` stores the current locale working-copy snapshot separately
from the published `PageLocale` or collection locale row; `ContentRevision`
continues as immutable history. Preview reads the working copy only after
server-side permission checks and is served from an Auth0-protected, `noindex`
route using the real public component composition.

Save does not take an existing publication offline. Direct publish atomically
applies the validated working copy; rollback creates a new draft/revision rather
than rewriting history. Scheduled page publication keeps the current public
snapshot live until the internal `CRON_SECRET`-authenticated worker applies the
working copy under a PostgreSQL advisory transaction lock. Scheduled provider
invocation/alerting remains a deployment gate.

## D-039 — Milestone 6 Admin Data-Minimization Boundary
**Status:** Accepted

The Turkish `/admin` shell is Auth0/session backed and permission-aware; roles
remain grant groupings only. Mutation services repeat server-side atomic
permission checks and same-origin validation. Production MFA remains automatic
for every admin permission check.

- Contact inbox lists only date, name, subject, locale and status. Full contact
  PII/message/provenance requires `Contact:view`; Viewer and Content Editor are
  denied. Notes, status and due-retention actions are separately permissioned
  and audited without message/note bodies.
- Media administration queries and mutates `storage_class = public` only.
  Protected/quarantine CV objects never enter the media library.
- Site settings accept only the existing non-secret allowlist. General content
  values are size/type checked and secret-like nested keys are rejected; Dealer
  Portal continues through its Super Admin-only HTTPS validator.
- Legal-page publish/schedule requires an explicit approved-copy reference;
  actual legal wording and approval references remain TBD business inputs.

## D-040 — Milestone 7 Candidate Workflow and Retention Scope
**Status:** Accepted

Candidate administration remains permission-based and server-enforced. The list
is a paginated, server-filtered minimal projection; phone, email, salary and
free-text introduction appear only in the protected detail view. Sensitive
detail access, notes, status changes, clean CV download and privacy operations
produce PII-safe audit records.

The v1 forward-only status graph is:

```text
new → in_review | rejected | archived
in_review → interview | rejected | archived
interview → hired | rejected | archived
rejected → archived
hired → archived
archived → terminal
```

Identical, reverse and skipped transitions are rejected server-side. Every
accepted transition writes `ApplicationStatusHistory` and `AuditEvent` in the
same PostgreSQL transaction.

Permission scope, not role name, controls destructive behavior:

- `Applications:anonymize` with `retention` scope may run only after
  `retention_due_at` and when no active hold exists,
- `all` scope may perform an explicitly audited early anonymization override,
- hard delete requires `Applications:delete` with `all` scope.

Anonymization clears candidate PII/free text, removes notes and the protected or
quarantine CV object/Media row, archives the neutral application row and keeps
status/audit history. Approved retention durations remain `TBD` configuration.

## D-041 — Disposable Local PostgreSQL Integration Environment
**Status:** Accepted for local/integration testing only

Use the official `postgres:18.4` image through `compose.test.yaml` for repeatable
local integration testing. `pnpm test:postgres` starts an isolated test-only
database on localhost port `55432`, applies committed migrations, checks Drizzle
metadata, runs the full suite with `TEST_DATABASE_URL`, and always removes the
container/network/temporary data.

This workflow does not emulate or replace Neon, S3, GuardDuty, SQS/EventBridge,
SES, Auth0 or Sentry production decisions. No production credentials are used.

## D-042 — Per-Request CSP and Milestone 8 Verification Boundary
**Status:** Accepted

Use a cryptographically random nonce generated in the Next.js proxy for every
request and forward the same policy/nonce to the App Router render. Scripts use
`'nonce-…'` plus `'strict-dynamic'`; script attributes are forbidden. Styles use
the request nonce, with one exact `unsafe-hashes` SHA-256 allowance for the
current Next Image-generated `color:transparent` style attribute. Global
`unsafe-inline`, `unsafe-eval`, wildcard provider origins and broad `https:`
sources are not allowed. Public media may add only a validated HTTPS origin.

Admin, preview, auth, API and the synthetic E2E presentation surface receive
`private, no-store`. Auth0 receives the same CSP nonce and callback return paths
are restricted to same-origin absolute paths. The E2E presentation surface
contains no session, API bypass or real data; it requires both `APP_ENV=test`
and `E2E_UI_TEST_SURFACE=enabled`, is noindex/robots-disallowed and is otherwise
404.

Milestone 8 uses Playwright with exact versions across Chromium, Firefox,
WebKit and mobile profiles. `pnpm test:integration` owns the disposable
PostgreSQL 18.4 lifecycle and includes migrations, all Vitest tests, production
build, browser/axe/responsive regression, portable backup/restore and rollback
contract validation before guaranteed cleanup. Lab CWV values are regression
diagnostics only; production field p75 evidence remains a launch gate.

## D-043 — Temporary Legal Content Lifecycle
**Status:** Accepted; supersedes D-039 only for temporary legal publication

Legal pages and the career/contact short notices use explicit content metadata.
`TEMP-2026-08-V1` is publishable for review and public presentation only when
`legal_status=temporary` and `requires_legal_review=true`. The admin shows
`Geçici metin — hukuk onayı bekleniyor`; the public page has no development
warning and temporary seed pages are noindex.

Final content requires a new non-temporary version, `legal_status=approved`,
`requires_legal_review=false` and a traceable approval reference. Any legal
body, metadata or embedded notice change must change the version. CMS revisions
remain immutable; the idempotent seed creates missing records only.

Form acknowledgement means “notice read”, not explicit consent. Production
forms fail closed on temporary/review-required notices, while historic
submissions retain the locale, version and shown/acknowledged timestamps they
originally recorded. Verified data-controller identity/application channels
come only from `contact_footer.legalController`; no business identity is
invented or placed in code.

## D-044 — Production Structural Baseline and Temporary Public Media
**Status:** Accepted; narrows D-036 and supersedes D-037's environment restriction

The public corporate site must not disappear solely because PostgreSQL or a
public-media provider is unavailable. CMS-published locale content remains the
first source. When no published row can be resolved, staging/production may use
a bounded `structural` source containing only AGENTS-approved facts, registered
localized route slugs and the versioned temporary legal content. This is distinct
from the local/test `placeholder` source: indexable corporate routes may be
served, while temporary legal and form routes remain noindex.

This availability rule does not apply to sensitive surfaces. Incomplete Auth0
closes admin; incomplete privacy/retention/notification/provider configuration
closes career or contact submission with a localized unavailable state.

The six project-generated, unbranded images may ship as production-safe
temporary public assets. Every manifest record carries
`temporaryMedia=true` and `requiresReplacement=true`; filenames are strictly
allowlisted, bundled by output tracing and cached without `immutable`. They are
not CMS records, documentary Ardaş photography or a license/brand claim.
Published CMS Media/MediaLocale records take precedence by media ID, so final
approved media replaces a placement without component/layout changes.
