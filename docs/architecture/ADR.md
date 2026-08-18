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
