# Architecture Decision Record Index

Formal project choices are mirrored in `.agent/DECISIONS.md`.

Use this file for implementation-level ADRs that emerge during coding.

## ADR Template

```md
## ADR-XXX — Title

Date:
Status: Proposed | Accepted | Superseded

### Context

### Decision

### Alternatives Considered

### Consequences

### Validation
```

## Seed ADRs

### ADR-001 — Locale Architecture

Status: Accepted

Use locale-prefixed public routes and localized slugs backed by stable internal route keys.

See:

- `.agent/DECISIONS.md`
- `../requirements/I18N.md`

### ADR-002 — Protected Candidate Files

Status: Accepted

CVs use protected object/file storage and authenticated authorized download, never public static URLs.

### ADR-003 — Permission-Based RBAC

Status: Accepted

Roles aggregate explicit permissions. Server actions/API handlers verify permissions directly.

### ADR-004 — Bilingual CMS From Initial Schema

Status: Accepted

Localized data is modeled before public pages are implemented.

### ADR-005 — Exact Milestone 0 Toolchain

Date: 2026-08-18
Status: Accepted

#### Context

The v0.3 baseline requires exact versions before scaffold and a reproducible
Node.js/pnpm toolchain.

#### Decision

Use:

```text
Node.js 24.19.0 LTS
pnpm 11.22.0
Next.js 16.3.1
React 19.2.8
TypeScript 6.0.3
ESLint 9.39.5
Vitest 4.1.10
```

#### Consequences

- `.node-version`, `packageManager`, engine ranges and CI pin the toolchain.
- application dependencies use exact versions and `pnpm-lock.yaml` is committed.
- upgrades are deliberate reviewed changes.

#### Validation

Run `pnpm install --frozen-lockfile` and `pnpm run check` on the pinned CI runtime.

### ADR-006 — Drizzle ORM and Drizzle Kit

Date: 2026-08-18
Status: Accepted

#### Context

The application needs PostgreSQL-backed, type-safe models and committed,
reviewable migrations for localized publishing and privacy-sensitive records.

#### Decision

Use Drizzle ORM 0.45.2, Drizzle Kit 0.31.10 and the `pg` driver. Generate and
commit reviewable PostgreSQL migrations with Drizzle Kit.

#### Alternatives Considered

- Prisma ORM 7.9.1 and Prisma Migrate.
- direct `pg` queries with hand-authored migrations.

Prisma was not selected because its optional CLI peer was resolved into the
production graph and exposed an unresolved high-severity transitive advisory at
the time of selection. Forcing a transitive major override was rejected.

#### Consequences

- schema and migrations are implemented in Milestone 1,
- migration SQL is committed and reviewed,
- database access remains server-only,
- custom SQL remains available when the typed query layer is insufficient.

#### Validation

Milestone 1 must prove clean migration, generation and database reset against a
non-production PostgreSQL instance.

### ADR-007 — PostgreSQL 18 and Reproducible Schema Migrations

Date: 2026-08-18
Status: Accepted

#### Context

Milestone 1 requires a clean PostgreSQL migration, deterministic regeneration,
and a schema that carries locale publication and personal-data invariants.

#### Decision

- Use PostgreSQL major version 18. The local and CI baseline is the official
  `postgres:18.4` image; Neon applies supported minor updates in production.
- Keep the Drizzle TypeScript schema in `src/db/schema.ts` and committed SQL in
  `drizzle/`.
- CI starts a clean PostgreSQL 18 service, applies every migration, runs the
  database integration tests, regenerates the migration metadata and rejects a
  diff.
- Migration promotion order is local/CI → staging → production. Production
  schema changes require a restore point and a forward-fix/rollback assessment.

#### Alternatives Considered

- PostgreSQL 17: supported and stable, but the current PostgreSQL 18 line has a
  longer support horizon and is supported by the chosen provider.
- Schema push without migration history: rejected because it is not reviewable
  or repeatable enough for production data.

#### Consequences

- Major-version upgrades are separate reviewed migrations/operations work.
- Provider-managed backups do not replace periodic logical export and restore
  exercises.

#### Validation

`pnpm run db:migrate`, `pnpm run db:check`, migration regeneration with a clean
Git diff, and the PostgreSQL integration suite must pass in CI.

Official references:

- https://www.postgresql.org/support/versioning/
- https://neon.com/docs/reference/compatibility
- https://hub.docker.com/_/postgres/tags

### ADR-008 — Stable Route Identity and Locale-Owned Publication

Date: 2026-08-18
Status: Accepted

#### Context

Turkish and English slugs can differ and can change without changing the
underlying content identity. An English URL must never silently render Turkish
content.

#### Decision

- The route-key registry is shared by application routing and the PostgreSQL
  `route_key` enum.
- Language-neutral parent rows own stable IDs; `*Locale` rows own locale,
  localized fields and publication state.
- Every independently localized entity uses `draft | published | archived`,
  `published_at`, `scheduled_publish_at`, and `scheduled_archive_at`.
- Direct access to a missing/unpublished locale variant resolves as unavailable
  so the route layer returns 404. The language switch alone may fall back to the
  target-locale homepage.
- Published slug changes create a `SlugRedirect` row constrained to HTTP 301.

#### Consequences

- Locale completeness is explicit and testable.
- Adding a system route key requires both code and migration review.
- Slug history remains independent of the localized content row.

#### Validation

Route registry tests, publication availability tests, schema tests and unique
locale/slug indexes must pass.

### ADR-009 — EU-Centred Managed Provider Topology

Date: 2026-08-18
Status: Accepted for architecture; provisioning and contracts pending

#### Context

The public site needs first-class Next.js hosting while candidate/contact data,
identity, object storage, email and monitoring require explicit regional and
security controls.

#### Decision

| Capability | Selected provider | Region / policy |
|---|---|---|
| Next.js hosting | Vercel | Node.js Functions `fra1` (Frankfurt); public static assets may use the global CDN |
| PostgreSQL | Neon | AWS Europe (Frankfurt), `eu-central-1`, PostgreSQL 18 |
| Object storage | Amazon S3 | Separate public, protected, quarantine and database-backup buckets in `eu-central-1` |
| Admin identity/MFA | Auth0 | EU tenant; separate environment tenants; MFA policy `Always`; public registration disabled |
| Transactional email | Amazon SES | `eu-central-1`; verified domain, DKIM/SPF/DMARC; notifications minimize PII |
| Application monitoring | Sentry | Germany data-storage region; strict PII scrubbing and no form bodies/CV data |
| AWS operational signals | CloudWatch/EventBridge | `eu-central-1` for GuardDuty, S3 and SES service events/alarms |

Vercel Functions are explicitly pinned to `fra1` so server execution stays near
Neon and AWS. Production secrets remain provider-managed environment secrets;
none are stored in `SiteSetting`.

Provisioning, commercial plan selection, DPA/subprocessor review, legal data
transfer assessment, named account owners and incident contacts remain `TBD`
production launch gates.

#### Alternatives Considered

- A single all-in-one backend provider: simpler, but weaker for the required S3
  malware scanning flow and provider portability.
- AWS RDS/Aurora for PostgreSQL: strong controls but more cost/operations than
  this initial corporate workload needs.
- Self-hosted authentication/MFA: rejected for v1 because mandatory MFA and
  secure recovery would expand the security-critical surface.
- US-only email/monitoring defaults: rejected because matching EU/Germany
  regions are available.

#### Consequences

- The project has multiple processors and must monitor cross-provider failures.
- PostgreSQL remains exportable with standard `pg_dump`/`pg_restore`.
- Vercel failover beyond the primary EU region requires a later availability
  and data-region decision; it is not silently enabled.

#### Validation

Before production, verify the configured tenant/project/bucket regions, execute
a database restore, verify email authentication, test MFA enforcement and prove
PII-safe monitoring.

Official references:

- https://vercel.com/docs/functions/configuring-functions/region
- https://neon.com/docs/introduction/status
- https://neon.com/docs/manage/projects
- https://auth0.com/docs/get-started/auth0-overview/create-tenants
- https://auth0.com/docs/secure/multi-factor-authentication/enable-mfa
- https://docs.aws.amazon.com/general/latest/gr/ses.html
- https://sentry.io/changelog/data-storage-location-in-germany-is-generally-available/

### ADR-010 — Fail-Closed CV Storage and Malware Scanning

Date: 2026-08-18
Status: Accepted

#### Context

Candidate CVs are personal data and untrusted uploads. A scanner outage must
never make an unverified file downloadable.

#### Decision

- Use separate Amazon S3 buckets for `public`, `protected`, and `quarantine`
  classes in `eu-central-1`.
- New CVs enter only the quarantine bucket/prefix. Amazon GuardDuty Malware
  Protection for S3 scans new objects in the same Region and publishes the
  result through EventBridge plus the managed object tag.
- Map `NO_THREATS_FOUND` to internal `clean`, `THREATS_FOUND` to `infected`, and
  `UNSUPPORTED | ACCESS_DENIED | FAILED` to `error`.
- Only a clean result may move/copy the object to protected storage and update
  the `Media` row to `protected/clean`. The database constraint rejects a
  protected media row without `clean` scan status.
- Pending, infected, error, timeout and missing events remain inaccessible and
  alertable. Event handling must be idempotent because scan events are
  at-least-once.
- Public media uses the public class; candidate CVs never do.

#### Alternatives Considered

- VirusTotal/public multi-scanner APIs: rejected because confidential CV
  contents must not be submitted to an uncontrolled public analysis service.
- Self-hosted ClamAV: viable fallback, but creates patching, capacity and
  availability ownership that GuardDuty avoids for v1.
- One bucket with application-only prefixes: rejected because separate buckets
  make IAM and accidental-public-access boundaries clearer.

#### Consequences

- S3/GuardDuty IAM, tags, EventBridge delivery, retry, queue age and quarantine
  backlog become production security monitors.
- GuardDuty configuration is a Milestone 2 implementation gate; Milestone 1
  establishes the state model only.

#### Validation

Milestone 2 must prove clean, infected, unsupported, access-denied, failed,
timeout and duplicate-event paths. No non-clean object may be downloaded.

Official references:

- https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html
- https://docs.aws.amazon.com/guardduty/latest/ug/how-malware-protection-for-s3-gdu-works.html
- https://docs.aws.amazon.com/guardduty/latest/ug/monitor-enable-s3-object-tagging-malware-protection.html

### ADR-011 — Milestone 2 Server Security Enforcement

Date: 2026-08-18
Status: Accepted; managed-service provisioning remains TBD

#### Context

Auth0, S3 and GuardDuty were selected in Milestone 1, but the application still
needed explicit identity binding, permission enforcement, at-least-once scan
delivery, fail-closed retries, audit integrity, abuse controls and retention
execution. Provider account configuration is not a substitute for an application
security boundary.

#### Decision

- Bind an Auth0 identity to exactly one local active admin through the immutable
  OIDC `sub` claim. Require standard `amr: mfa` evidence for all production admin
  access and every protected CV download; missing evidence denies access.
- Keep the Auth0 EU tenant policy at MFA `Always` and public registration off.
  The application check is an independent fail-closed layer, not a replacement
  for tenant policy.
- Expand every RBAC matrix row into atomic permission keys. Runtime code loads
  permission + scope from PostgreSQL and never authorizes by role name. Seed the
  accepted role grouping in a migration and exhaustively test every allowed and
  denied role/permission pair.
- Deliver GuardDuty object-scan events from EventBridge to private SQS. Store the
  provider event ID uniquely, treat delivery as at-least-once, and accept only the
  configured quarantine bucket. Only `NO_THREATS_FOUND` promotes an object.
- Mark missing/error/timeout scans inaccessible, emit a safe operational signal,
  and re-key/re-submit quarantine objects with bounded backoff for at most three
  attempts. S3 promotion failure is compensated by deleting any incomplete
  protected copy before retry.
- Use PostgreSQL atomic fixed-window rate buckets. HMAC the client identifier with
  a server secret so raw IP/form identity is never stored.
- Make audit rows append-only with a PostgreSQL update/delete trigger. All audit
  writers pass metadata through the PII redaction boundary.
- Support scheduled anonymization using existing deadlines plus optional holds.
  Personal/free-text fields and CV objects are removed; the database permits the
  nullable post-retention shape only when `anonymized_at` is present.
- Resolve Dealer Portal as validated setting, then validated environment fallback,
  then disabled. Reject credentials, query, fragment and non-443 explicit ports in
  addition to requiring HTTPS and an optional exact host allowlist.

#### Alternatives Considered

- Auth0 role/permission claims as the only authorization source: rejected because
  account disable/revocation and application scopes must be authoritative on every
  server request without trusting editable role names.
- Direct public EventBridge webhook: rejected because a private SQS target gives
  AWS-authenticated polling, at-least-once buffering and DLQ/queue-age controls.
- In-memory/serverless rate limits: rejected because concurrent Vercel instances do
  not share state. A separate Redis provider was not added for the initial form
  volume because PostgreSQL already provides the needed atomic boundary.
- A retention default: rejected because the approved legal/business durations are
  still `TBD` and must not be invented.

#### Consequences

- Auth0 EU tenant creation, factor enablement, `Always` policy verification, admin
  account bootstrap and recovery testing remain production deployment gates.
- S3 bucket/IAM/TBAC, GuardDuty tagging, EventBridge rule, SQS/DLQ, scheduler and
  alarm provisioning must be validated in the real AWS account before submissions
  are enabled.
- Static CSP currently allows inline scripts/styles for Next.js compatibility; the
  nonce/hash hardening follow-up is recorded as R-028.
- Public form endpoints enforce size/rate controls but intentionally remain
  unavailable until their persistence milestones.

#### Validation

Milestone 2 validation includes exhaustive RBAC positives/negatives, production
MFA denial, clean/error/timeout/promotion scan states, unscanned and unauthorized
CV download denial, application/file relationship checks, audit immutability and
mutation events, rate-limit atomicity, retention shape, PII redaction, security
headers and clean PostgreSQL migration/regeneration.

Official references:

- https://auth0.com/docs/quickstart/webapp/nextjs
- https://auth0.com/docs/secure/multi-factor-authentication/enable-mfa
- https://dev.auth0.com/docs/secure/multi-factor-authentication/step-up-authentication/configure-step-up-authentication-for-web-apps
- https://docs.aws.amazon.com/guardduty/latest/ug/monitor-with-eventbridge-s3-malware-protection.html
- https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html
- https://www.postgresql.org/docs/current/sql-insert.html

### ADR-012 — Tokenized Server-First Public Design System

Date: 2026-08-19
Status: Accepted; final brand identity remains TBD

#### Context

Milestone 3 needs a production public shell before the final logo, palette,
typeface, photography and CMS content are approved. It must express the accepted
Swiss-inspired corporate direction without copying ABB or introducing a generic
UI-library visual language. The existing locale, Dealer Portal and security
boundaries must remain authoritative.

#### Decision

- Own the presentation layer through CSS custom-property token families for
  color/surfaces, typography, spacing, grid, radius, border, motion, z-index and
  breakpoints. Use mobile-first 4/8/12-column layout primitives.
- Use provisional `#0057B8` as the single accent and a Helvetica/Arial-compatible
  system stack. Both are replaceable tokens and explicitly are not final brand
  approvals.
- Represent the temporary `ARDAŞ` mark through a replaceable text-wordmark
  component rather than an embedded final logo asset.
- Keep the shell server-first. Client JavaScript is limited to mobile-menu focus
  management and the current-path locale switch.
- Pass the existing server-side Dealer Portal resolution into presentation
  components. Components never read settings/environment values or hard-code the
  portal URL.
- Keep the design-system preview outside production navigation, mark it `noindex`,
  and return 404 for it in production.

#### Alternatives Considered

- ABB red and a visual clone: rejected because ABB is a design-language reference,
  not Ardaş's brand identity.
- A component library with default tokens and card patterns: rejected because it
  would add weight and conflict with the typography/grid-led corporate direction.
- An externally hosted webfont before approval: rejected because licensing,
  identity choice and an additional rendering dependency are still unresolved.
- A client-rendered shell: rejected because navigation/footer do not need client
  state and minimal JavaScript better supports accessibility and performance.

#### Consequences

- Final identity adoption is localized to tokens, wordmark and approved font/media
  assets instead of requiring a shell rewrite.
- The provisional palette and font must not be treated as production brand signoff;
  the existing launch-gate TBD remains.
- Mobile focus trapping, focus return, localized navigation, reduced motion,
  contrast and overflow require explicit regression validation.

#### Validation

Validate with lint/typecheck/build, component and route tests, axe semantic checks,
token contrast tests, keyboard focus-trap tests, reduced-motion checks and
mobile/tablet/desktop HTTP/render review.

### ADR-013 — Versioned, Publication-Aware Public Renderer

Date: 2026-08-19
Status: Accepted; approved production content and media remain TBD

#### Context

Milestone 4 must render bilingual corporate pages from the Milestone 1 data
model without implementing the Milestone 6 admin CMS. Direct locale access,
language switching, SEO and media must all enforce one publication boundary.
Unapproved copy, brands, taxonomy, addresses, legal text and photography must not
be invented or leak into production.

#### Decision

- Resolve every page through its language-neutral `Page.route_key` and the
  requested `PageLocale`. Require the registered localized slug plus an active
  publication window; a missing/unpublished variant returns 404.
- Treat `PageLocale.content_json` as a bounded `schemaVersion: 1` editorial-block
  document. Parse known text fields, internal route-key calls to action and UUID
  media references. Do not accept raw HTML, arbitrary components or external CTA
  URLs from editorial JSON.
- Query brands, product groups and locations only when the parent is active and
  the requested locale row is publicly available. The homepage uses only brands
  marked `featured`.
- Resolve imagery only from the public storage class and a published matching
  `MediaLocale`. Build object URLs from a validated HTTPS
  `PUBLIC_MEDIA_BASE_URL`; require dimensions and localized alt text for
  meaningful imagery. Explicit decorative blocks receive empty alt semantics.
- Permit explicit `TBD` documents only in local/test environments so development
  can be reviewed without fabricated production content. Never use this fallback
  in staging or production and mark all fallback metadata `noindex`.
- Generate canonical, hreflang, Open Graph and Twitter metadata from the same
  publication result. Include only CMS-published pages in the dynamic sitemap.
- Send language-switch links through a server resolver, which selects the
  published equivalent or the target locale homepage according to I18N policy.

#### Alternatives Considered

- Raw HTML stored in `content_json`: rejected because it expands the XSS and
  design-consistency boundary and is harder to validate/revise safely.
- Hard-coded production page copy and collection entries: rejected because
  approved business/legal/media content is still `TBD` and the models already
  define locale-owned publication.
- Client-side content fetch and publication checks: rejected because it can leak
  unpublished payloads, weakens SEO and duplicates the server security boundary.
- Always falling back to development copy when the database is empty: rejected
  because production must fail closed for unpublished content.

#### Consequences

- Milestone 6 authoring must emit and validate the versioned block contract and
  use existing revision snapshots for preview/rollback.
- Production requires `SITE_URL`, `DATABASE_URL` and an HTTPS
  `PUBLIC_MEDIA_BASE_URL` before approved media can render and index correctly.
- Invalid/missing media metadata degrades to the explicit pending-media surface
  rather than publishing an inaccessible image.
- Adding a new public block type requires a reviewed schema/parser/renderer
  change rather than arbitrary CMS markup.

#### Validation

Validate parser bounds and route allowlists, local-versus-production fallback,
localized publication and slug denial on PostgreSQL, featured collection
rendering, media URL/alt constraints, publication-aware canonical/hreflang and
sitemap behavior, localized route HTTP status, axe semantics, token contrast,
reduced motion and mobile-first overflow contracts.

### ADR-014 — Local/Test Demo Media Art Direction

Date: 2026-08-19
Status: Accepted for visual prototyping; final identity and photography remain TBD

#### Context

Milestone 4's publication-aware pages are structurally complete, but approved
photography, brand assets and final identity do not yet exist. Visual polish must
be reviewable without inventing brands or allowing prototype assets to become a
production content/storage fallback.

#### Decision

- Use six generated, replaceable industrial editorial images for local/test
  review only: warehouse hero, distribution operation, parts detail, loading
  facility, workplace/careers and a decorative portfolio rhythm.
- Keep generated assets under workspace `demo-media/` (outside Next.js `public/`)
  with a typed manifest and a local/test-only whitelist route that
  mirrors the current public `Media` / `MediaLocale` presentation shape. Record
  stable demo IDs, dimensions, TR/EN alt text, decorative semantics, intended
  placement and focal points.
- Load the manifest only through the existing local/test development-content
  gate. Do not seed PostgreSQL, weaken public-storage checks or provide a
  staging/production fallback.
- Refine the single provisional accent to desaturated petrol `#006B63`, with
  `#004C47` hover and `#E4F0EE` soft aliases. This supersedes the provisional
  blue named in ADR-012 but remains replaceable and is not brand signoff.
- Preserve the typography/grid-led Swiss corporate direction: images support
  distribution, scale and people; they do not create a vehicle gallery,
  ecommerce catalogue, repair-shop or SaaS-card aesthetic.

#### Alternatives Considered

- Seed demo rows into PostgreSQL: rejected because prototypes could be confused
  with approved CMS publication and would cross the data/content boundary.
- Use arbitrary remote stock-image URLs: rejected because availability, rights,
  tracking and art-direction consistency would be uncontrolled.
- Keep geometric placeholders only: rejected because the milestone explicitly
  needs meaningful art-direction validation beyond a wireframe state.
- Adopt ABB red or a direct ABB layout: rejected because ABB remains an
  inspiration reference, not Ardaş's identity.

#### Consequences

- Approved launch photography can replace demo assets without component changes,
  but content owners must complete the production Media/MediaLocale workflow.
- Source PNGs are intentionally temporary and increase repository/build size;
  final assets need responsive-format budgets and real CWV measurement (R-011).
- The generated set must never be presented as real Ardaş facilities, employees
  or product inventory; R-030 remains an explicit launch/content gate.

#### Validation

Validate manifest/file completeness, unique stable IDs, locale-aware alt and
decorative contracts, local/test-only fallback, Next Image delivery, token
contrast, axe semantics, reduced motion, responsive layout contracts, production
routes/headers, lint, typecheck, tests, build, migration no-diff and dependency
audit.

### ADR-015 — Transactional Submission Persistence and Durable Notification Outbox

Date: 2026-08-19
Status: Accepted

#### Context

Public contact and career submissions contain personal data and must not be lost
when SES is unavailable. Career persistence also crosses PostgreSQL and S3, which
cannot share one atomic transaction, while CV access must remain fail-closed
through asynchronous GuardDuty scanning. Fast double submits must not create
duplicate records, but legitimate later submissions must remain possible.

#### Decision

- Treat PostgreSQL as authoritative. Persist each accepted submission, one
  `SubmissionNotification` outbox row and its PII-minimized audit event in one
  database transaction. Attempt SES only after commit; store failure as a safe
  retryable outbox state without rolling back or reporting a persisted record as
  lost.
- Send record-ID, purpose and locale only. Do not include contact/candidate PII,
  message body, salary or CV content in email or operational events.
- Use a client-generated submission UUID as a narrow double-submit token. Store
  only its SHA-256 hash under a unique constraint; a deliberate later submission
  receives a new token and is not subject to broad email/phone deduplication.
- Validate the career payload, referenced published department/location and PDF
  before persistence. Upload to a random-key quarantine object, then bind its
  `Media` row, application, outbox and audit event transactionally. If the
  transaction loses a race or fails, run compensating object/metadata cleanup;
  the scan worker also removes aged unattached quarantine objects.
- Defer career notification while scan state is not clean/protected. Scanner
  pending/error/timeout remains inaccessible and retryable; infected files stay
  quarantined, cancel notification and produce only a safe localized public
  status. A rate-limited same-origin status endpoint resolves the hashed
  submission token without returning PII or scanner details.

#### Alternatives Considered

- Send email before or inside record creation: rejected because provider failure
  could lose the only durable record or hold a database transaction open.
- Store the original idempotency token or deduplicate on candidate identity:
  rejected because the token need not be recoverable and identity deduplication
  would block legitimate applications.
- Promote or notify before GuardDuty is clean: rejected because it violates the
  fail-closed CV boundary.
- Assume PostgreSQL and S3 can commit atomically: rejected; compensating cleanup
  and scheduled orphan recovery make the real cross-system boundary explicit.

#### Consequences

- Notification delivery is eventually consistent and requires the authenticated
  internal retry job plus SES monitoring.
- An infected attempt remains an auditable/retention-managed application record
  with an inaccessible quarantine object; a new safe file requires a new public
  submission token.
- Production forms remain independently disabled when their required privacy,
  retention, origin, provider or security configuration is incomplete; the rest
  of the corporate site remains available.

#### Validation

Validate strict TR/EN server contracts, provenance/retention, unique idempotency,
notification-failure persistence, record-ID-only payloads, quarantine cleanup,
pending/error/infected denial, clean promotion, public scan-status minimization,
real PostgreSQL constraints/migrations, logging redaction, accessibility, HTTP
behavior, lint, typecheck, full tests, build and dependency audit.
