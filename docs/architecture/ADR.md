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
