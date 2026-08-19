# Ardaş Yedek Parça Corporate Website

## 1. Project overview

Production-oriented, bilingual corporate website and Turkish administration
application for Ardaş Yedek Parça. The product presents automotive aftermarket
distribution capability; it is not e-commerce, a B2B replacement, a repair-shop
site, a marketplace or a vehicle showroom.

Verified public facts are limited to İstanbul, Ankara and Diyarbakır locations,
Türkiye-wide distribution, 30+ years of experience, 150+ brands and 50,000+
products. Missing legal/business information is never invented.

## 2. Implementation status

Milestones 0–9 cover the public TR/EN site, CMS/admin, career and contact flows,
security controls, migrations, regression automation, deployment configuration
and launch runbooks. Software readiness and external production provisioning are
tracked separately in `docs/operations/PRODUCTION_READINESS.md`.

Temporary legal content is versioned as `TEMP-2026-08-V1`, marked `temporary`
and `requires_legal_review=true`. It keeps legal pages presentable but cannot
enable production submissions.

## 3. Architecture

```text
Browser
  → Vercel fra1 / Next.js App Router
    → Neon PostgreSQL 18 (pooled runtime; direct migration connection)
    → Auth0 EU (admin identity; MFA Always in production)
    → Amazon S3 eu-central-1 (public / quarantine / protected)
    → GuardDuty → EventBridge → SQS → application scan processor
    → Amazon SES eu-central-1 (record-ID-only notifications)
    → PII-safe structured logs → Sentry Germany / CloudWatch
```

The public corporate shell has a verified structural fallback. Missing providers
therefore do not close `/tr` or `/en`; only dependent sensitive functions fail
closed. Admin requires complete Auth0 configuration. Career and contact submit
remain unavailable until their complete privacy, retention and provider gates
pass.

## 4. Tech stack

- Next.js App Router, React and TypeScript
- pnpm with a frozen lockfile
- PostgreSQL 18 and Drizzle ORM/migrations
- Vitest, Testing Library, Playwright and axe
- Auth0, AWS SDK for S3/SQS/SES

Managed production providers are fixed by accepted architecture decisions:
Vercel, Neon, AWS, Auth0 EU and Sentry Germany.

## 5. Exact runtime versions

```text
Node.js: 24.19.0 (project and CI pin; engines 24.19.x)
pnpm: 11.22.0
Next.js: 16.3.1
React / React DOM: 19.2.8
TypeScript: 6.0.3
PostgreSQL test image: 18.4
```

`.node-version`, `package.json#engines` and GitHub Actions enforce the project
runtime. The current Windows workstation may report Node `24.14.0`; that local
mismatch is a warning and must not be used to lower the `24.19.x` project pin.

## 6. Windows setup

Install Git, Docker Desktop and Node.js `24.19.0`. Enable Corepack, then confirm
the versions from PowerShell:

```powershell
node --version
corepack enable
corepack pnpm --version
docker version
```

Docker Desktop must be running before PostgreSQL integration or full regression
commands. Copy `.env.example` to `.env.local` and fill only local credentials.

## 7. Install

From the repository root:

```powershell
corepack pnpm install --frozen-lockfile
```

Do not commit `.env*` secrets. The lockfile and dependency versions are exact;
dependency upgrades are separate reviewed changes.

## 8. Development

Start the application:

```powershell
corepack pnpm run dev
```

Open `http://localhost:3000`; `/` redirects to `/tr`. Local/test content may use
the development source while staging/production use CMS data or the verified
structural baseline. The design-system preview is development-only, noindex and
absent from production navigation.

## 9. Environment variables

`.env.example` is the authoritative variable inventory. It labels runtime,
migration, Auth0, AWS, GuardDuty/SQS, SES, Sentry, Dealer Portal, retention,
feature flags and internal-job configuration, including whether values are
secret and where they are required.

Production rules:

- Store secrets in Vercel/provider secret management, never Site Settings.
- Use HTTPS origins outside local development.
- Keep both public form flags `false` until every associated launch gate passes.
- Keep provider resources isolated between staging and production.
- Set `CRON_SECRET` and `RATE_LIMIT_HASH_SECRET` to independent random values of
  at least 32 characters.

## 10. Database

The canonical schema is `src/db/schema.ts`; committed SQL and Drizzle metadata
are under `drizzle/`. PostgreSQL owns localized publication, revision history,
RBAC, submissions, CV state, audit events, settings, retention and outbox state.

In production, `DATABASE_URL` is the Neon pooled runtime URL. Keep the application
pool bounded and use `MIGRATION_DATABASE_URL` as the direct/non-pooled release-job
URL. Local development may point both operations at the same PostgreSQL instance.

## 11. Migrations

Check and generate locally:

```powershell
corepack pnpm run db:check
corepack pnpm run db:generate
git diff -- drizzle
```

Production release order is backup/recovery-point confirmation, migration with
the direct URL, idempotent seed, deploy, then smoke checks:

```powershell
$env:MIGRATION_DATABASE_URL = "<NEON-DIRECT-URL>"
corepack pnpm run db:migrate
corepack pnpm run db:seed:production
```

Migrations and seeds must run in a controlled release job, never automatically
inside the Vercel build. Rehearse the same commit in staging first.

## 12. Seeds

```powershell
corepack pnpm run db:seed:production
```

The seed creates only missing structural page locales/revisions, verified scale
settings and the versioned temporary legal/form-notice records. Migration-owned
TR/EN departments and İstanbul/Ankara/Diyarbakır locations are verified. Existing
CMS locale rows and settings are preserved, so repeating the command is safe.

It never creates fake administrators, candidates, contact submissions, brands,
certificates, legal identity, contact details or provider identifiers.

## 13. Tests and one-command validation

```powershell
corepack pnpm run validate
corepack pnpm run audit:prod
```

`validate` runs lint, Next route generation/TypeScript, unit/component tests and
the production build. `audit:prod` checks production dependencies at high
severity and above. Individual commands remain available as `lint`, `typecheck`,
`test` and `build`.

## 14. Docker integration testing

```powershell
corepack pnpm run test:postgres
corepack pnpm run test:integration
```

Both commands own an isolated PostgreSQL `18.4` container on localhost port
`55432`, apply clean migrations, run the production seed twice, verify Drizzle
metadata and execute PostgreSQL tests. `test:integration` additionally validates
migration regeneration, build, the complete browser matrix, portable backup /
restore and rollback documentation. A `finally` cleanup removes the disposable
container, network and volume on success or failure.

## 15. E2E / Playwright

Install exact browser engines once, then run:

```powershell
corepack pnpm run test:e2e:install
corepack pnpm run test:e2e
```

The production-build suite covers Chromium, Firefox, WebKit, Android Chrome and
iOS Safari profiles; axe, keyboard/focus, reduced motion, localized routes,
forms, metadata/security behavior and responsive widths from 320 to 1920 pixels
are included. The synthetic admin test surface contains no real account, session,
candidate, contact or API access and is enabled only when `APP_ENV=test` and
`E2E_UI_TEST_SURFACE=enabled`.

With a test-gated production server running at port `3100`, create the final
synthetic public/admin artifact set with:

```powershell
corepack pnpm run screenshots:final
```

## 16. Production build

```powershell
corepack pnpm run build
corepack pnpm run start
```

The six project-generated, unbranded images are bundled as temporary public
media with `temporaryMedia=true` and `requiresReplacement=true`. They do not
claim to show Ardaş facilities or employees. A published CMS Media/MediaLocale
record with the same placement replaces them without component/layout changes.

## 17. Admin / Auth0

The Turkish `/admin` application has no public registration. Authentication is
Auth0 EU-backed; production permission checks require MFA. Roles group grants,
but every real server service authorizes the atomic permission/scope from the
RBAC matrix. Preview, revision, schedule, rollback, settings, user/role, audit,
HR, contact and CV boundaries are server enforced.

Until the production tenant, callback/logout/origin allowlists, claim mapping and
MFA Always policy are verified, incomplete Auth0 configuration returns an admin
unavailable response instead of a bypass.

## 18. AWS CV pipeline

```text
PDF ≤ 10 MiB
→ extension + MIME + PDF signature validation
→ random key in quarantine S3
→ GuardDuty Malware Protection for S3
→ EventBridge
→ SQS (retry + DLQ)
→ application processor
→ clean object promoted to protected S3
```

Error, timeout, unsupported or unavailable scanner states remain quarantined and
inaccessible. CV download requires authentication, MFA,
`Applications:cv-download`, a server-verified application/file relationship and
`clean` scan state. Bucket encryption, versioning/lifecycle, least-privilege IAM,
queue age, DLQ and alarm provisioning are external production tasks.

## 19. Email and outbox

Career/contact data and an outbox notification commit in the same database
transaction. SES messages contain record identifiers and safe operational
context, not candidate/contact bodies or CV content. Delivery failure never
rolls back an accepted database submission; the internal worker records a safe
error and retries according to its outbox state.

Production requires a verified SES sender/domain, HR and Contact Manager
recipients, SPF, DKIM, DMARC, bounce/failure visibility and scheduled worker
invocation. No recipient is hard-coded or seeded.

## 20. Security

- Per-request CSP nonce, `strict-dynamic`, no global `unsafe-inline` or
  `unsafe-eval`, HSTS and the header baseline.
- Permission/scope RBAC, production MFA contract and private/no-store admin/API.
- PDF-only fail-closed CV quarantine and protected download checks.
- Same-origin, body-size, rate-limit and honeypot controls for public forms.
- Structured PII redaction before logs leave the application.
- Immutable content revisions and append-oriented audit events without raw PII.
- Temporary legal notice provenance and production form fail-closed gates.

Security policy details live under `docs/security/` and are regression-tested.

## 21. Deployment

Vercel is configured for Next.js, `fra1`, pnpm `11.22.0`, frozen install and the
production build. A deployment promotion is:

```text
CI green
→ staging backup/recovery point
→ direct-URL migration
→ idempotent production seed
→ staging smoke/E2E
→ production backup/recovery point
→ production migration + seed
→ Vercel promotion
→ public/admin/form-provider smoke checks
```

Use secure Vercel environment variables, configure the canonical domain and
TLS, and keep staging resources isolated. Provider credentials are never needed
for the public structural corporate shell, but dependent sensitive features stay
disabled until their own configuration is complete.

## 22. Production gates

Software completion does not assert external go-live readiness. Exact legal
identity/contact/address data, approved legal texts and retention durations,
Auth0/Neon/Vercel/AWS/SES/Sentry provisioning, domain/DNS/email authentication,
provider DPA/data-region review, production backup/PITR evidence and deployed
field CWV remain `BLOCKED_EXTERNAL`.

The authoritative, actionable split is
`docs/operations/PRODUCTION_READINESS.md`. Do not enable career/contact production
flags until that register's relevant legal, privacy and provider gates are closed.

## 23. Troubleshooting

- **Node engine warning:** install `24.19.0`; do not change the project pin to the
  local `24.14.0` workstation version.
- **Docker cannot connect:** start Docker Desktop and confirm `docker version`.
- **Port 55432 busy:** stop the conflicting local process/container, then rerun
  `test:postgres`; do not edit production connection settings.
- **Admin returns 503:** complete all Auth0 variables and the allowed Auth0 URLs.
- **Forms show unavailable:** verify approved notice version, retention, feature
  flag, rate-limit secret, recipient/SES/internal worker and (career) Auth0/S3 /
  GuardDuty/SQS requirements.
- **Public CMS media is absent:** verify a published matching MediaLocale and an
  HTTPS `PUBLIC_MEDIA_BASE_URL`; temporary structural media remains available.
- **Migration connection fails:** use the Neon direct URL in
  `MIGRATION_DATABASE_URL`, not the pooled runtime endpoint.

## 24. Important documentation

- `AGENTS.md` — immutable project facts and working policy
- `.agent/plans/WEBSITE_IMPLEMENTATION.md` — milestone and validation record
- `.agent/DECISIONS.md`, `.agent/RISKS.md` — accepted decisions and risks
- `docs/architecture/` — system, data model, environments and ADRs
- `docs/security/` — RBAC, upload, CSP/security, audit and privacy controls
- `docs/operations/` — deploy, domain/email, monitoring, backup and readiness
- `docs/requirements/I18N.md` — localized route/publication contract
- `docs/testing/TEST_MATRIX.md` — quality and browser coverage
