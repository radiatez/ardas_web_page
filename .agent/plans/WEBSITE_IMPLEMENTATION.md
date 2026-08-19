# Ardaş Corporate Website — Implementation Plan v0.3

## Objective

Build a secure bilingual corporate website and Turkish admin panel for Ardaş Yedek Parça.

## Technology Baseline

Chosen before scaffold:

```text
Framework: Next.js
Language: TypeScript
Package manager: pnpm
Database: PostgreSQL
```

Exact versions and service providers are decided at the start of Milestone 0 and recorded.

## Context

Read:

- `AGENTS.md`
- `docs/PROJECT_BRIEF.md`
- `.agent/DECISIONS.md`
- `.agent/RISKS.md`
- `docs/architecture/*`
- `docs/security/*`
- `docs/requirements/*`
- `docs/testing/TEST_MATRIX.md`

## Non-Goals

- replacing Dealer Portal/B2B
- public checkout/pricing
- full commerce catalogue
- workshop booking
- vehicle sales

---

# Milestone 0 — Exact Versions, Repository, Scaffold & Environments

Status: `[x]`

## Tasks

- [x] Confirm repository root `ardas_web_page`.
- [x] Select exact Next.js / Node runtime / pnpm / TypeScript versions.
- [x] Record exact versions in ADR/README/package manager config.
- [x] Decide ORM/data-access layer.
- [x] Initialize/verify Git and initial commit.
- [x] Scaffold Next.js application.
- [x] Configure strict TypeScript.
- [x] Create `package.json` scripts.
- [x] Commit-ready `pnpm-lock.yaml`.
- [x] Add `.gitignore`.
- [x] Add safe `.env.example`.
- [x] Create local/staging/production environment structure.
- [x] Add lint/typecheck/test/build.
- [x] Add CI baseline.
- [x] Select migration mechanism.

## Acceptance

- clean checkout installs with pnpm,
- framework/package manager chosen before scaffold,
- initial Git history exists,
- build/lint/typecheck commands exist,
- secrets are not committed.

## Validation

Record real commands and CI result.

### Validation Record — 2026-08-18

Environment:

```text
Windows 11 / PowerShell
Node.js 24.19.0 LTS (exact temporary runtime invocation)
pnpm 11.22.0 via Corepack
```

Commands:

```text
pnpm install --frozen-lockfile
pnpm peers check
pnpm audit --prod --audit-level=high
pnpm run check
```

Results:

- frozen lockfile install passed,
- peer dependency check passed,
- production dependency audit: no known vulnerabilities,
- ESLint passed with zero warnings,
- TypeScript passed,
- Vitest: 2 files / 5 tests passed,
- Next.js production build passed,
- `/tr` and `/en` were statically generated,
- root redirect contract test passed,
- production HTTP smoke: `/` 307 → `/tr`, `/tr` 200 with `lang=tr`, `/en`
  200 with `lang=en`, unsupported `/de` 404 without an application error log.

Notable fix:

- Prisma 7.9.1 was rejected after its resolved production graph exposed a high
  transitive advisory. Drizzle ORM/Kit was selected, optional peer auto-install
  was disabled, the lockfile was regenerated cleanly and the audit passed.

Remote validation:

- authorized target: `https://github.com/radiatez/ardas_web_page.git`, default
  branch `main`, authenticated owner permission `admin` / `push`,
- first push commit: `66976476a8cf51284c658cba7bf3f44886357338`,
- GitHub Actions `CI` run `#1` / run ID `32146805801`: `success`, attempt 1,
  completed 2026-08-18,
- run URL:
  `https://github.com/radiatez/ardas_web_page/actions/runs/32146805801`.

Git record:

```text
5e39f02 chore: initialize v0.3 Next.js application
d5f8fdf docs: record milestone 0 local validation
6697647 fix: keep unsupported locale 404 logs clean
```

---

# Milestone 1 — Architecture, Data Model, Providers, TR/EN & Routing

Status: `[x]`

## Tasks

- [x] Select hosting, PostgreSQL hosting, object storage, auth/MFA, malware, email and monitoring providers.
- [x] Document data regions and remaining provisioning/legal gates.
- [x] Select PostgreSQL 18 and implement the Drizzle schema.
- [x] Implement stable route keys + localized slugs.
- [x] `/` → `/tr`.
- [x] Implement unpublished locale availability/404 contract.
- [x] Implement switch fallback.
- [x] Implement SlugRedirect.
- [x] Implement locale-aware publication on all localized entities.
- [x] Implement Department/DepartmentLocale.
- [x] Implement Media/MediaLocale.
- [x] Implement form privacy provenance and retention fields.
- [x] Keep `CareerApplication.job_posting_id` nullable.
- [x] Implement AuditEvent foundation.
- [x] Implement secret-excluding SiteSetting model.
- [x] Configure DB/migrations.
- [x] Define public/protected/quarantine storage classes.
- [x] Record provider/architecture ADRs and decisions.

## Acceptance

- clean DB migration works,
- all localized public entities have publication state,
- route/slug rules pass tests,
- privacy provenance exists in schema,
- Department is managed data,
- storage classes exist.

## Validation

### Validation Record — 2026-08-18

Authoritative remote environment:

```text
GitHub Actions ubuntu-24.04
Node.js 24.19.0
pnpm 11.22.0
PostgreSQL 18.4 (official service image)
Drizzle ORM 0.45.2 / Drizzle Kit 0.31.10
```

Commands / CI gates:

```text
pnpm install --frozen-lockfile
pnpm run db:migrate
pnpm run db:check
pnpm run db:generate
git diff --exit-code -- drizzle
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
pnpm run audit:prod
```

Results:

- frozen install passed on the pinned runtime,
- initial migration applied to a newly initialized PostgreSQL 18.4 database,
- migration journal was recorded and the schema created 27 application tables,
- Drizzle migration metadata check passed,
- regeneration produced no schema/migration Git diff,
- ESLint passed with zero warnings,
- TypeScript and Next.js route type generation passed,
- Vitest: 6 files / 32 tests passed, including 3 real PostgreSQL migration
  tests, 13 localized-route tests and 9 data-model contract tests,
- production build passed; `/tr` and `/en` were statically generated,
- production dependency audit: no known vulnerabilities,
- GitHub Actions `CI` run `#3` / run ID `32148719586`: `success`, attempt 1,
  commit `decce3de9ed611f47648501861ef6fd25a73c9b3`,
- run URL:
  `https://github.com/radiatez/ardas_web_page/actions/runs/32148719586`.

Local note:

- the Windows host has no Docker/PostgreSQL service, so the 3 DB integration
  tests were skipped locally; the authoritative clean-database execution is the
  successful remote PostgreSQL 18.4 job above,
- local migration SQL and snapshot hashes remained identical after regeneration,
  and lint/typecheck/unit tests/build/audit passed.

Provider/region decisions:

- Vercel `fra1`, Neon/AWS Frankfurt, S3/GuardDuty/SES `eu-central-1`, Auth0 EU,
  and Sentry Germany were recorded in ADR-009/010 and D-025,
- account provisioning, commercial/DPA/legal review, exact backup RPO/RTO and
  production owners/recipients remain explicit `TBD` launch gates.

---

# Milestone 2 — Security Foundation: MFA, RBAC, Audit, Upload & Retention

Status: `[x]`

## Tasks

- [x] Admin authentication.
- [x] MFA mandatory in production.
- [x] Server permission framework.
- [x] Implement RBAC incl. Contact Manager.
- [x] Audit foundation + integrity policy.
- [x] Protected/quarantine CV storage.
- [x] PDF-only 10MB validation.
- [x] Mandatory malware scanner.
- [x] Fail-closed scan behavior.
- [x] Protected CV download.
- [x] Rate limiting.
- [x] PII-safe logging.
- [x] Retention cleanup mechanism.
- [x] Dealer Portal secure setting.
- [x] Security headers/error baseline.
- [x] Incident-response/secret-rotation operational hooks.

## Acceptance

- MFA enforced,
- role negative tests pass,
- Viewer/Editor cannot read contact messages,
- Editor cannot read candidates,
- HR cannot change Dealer Portal,
- unscanned CV cannot download,
- scanner outage stays fail-closed,
- audit events exist,
- logs avoid raw PII.

## Validation

Run security/RBAC/upload test matrix.

### Validation Record — 2026-08-18

Authoritative remote environment:

```text
GitHub Actions ubuntu-24.04
Node.js 24.19.0
pnpm 11.22.0
PostgreSQL 18.4 (official service image)
Next.js 16.3.1 / Auth0 Next.js SDK 4.27.0
AWS SDK for JavaScript v3.1112.0 (S3 + SQS)
Drizzle ORM 0.45.2 / Drizzle Kit 0.31.10
```

Commands / CI gates:

```text
pnpm install --frozen-lockfile
pnpm run db:migrate
pnpm run db:check
pnpm run db:generate
git diff --exit-code -- drizzle
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
pnpm run audit:prod
```

Results:

- frozen install passed on the pinned runtime,
- both committed migrations applied to a newly initialized PostgreSQL 18.4
  database and created the 29-table Milestone 2 schema,
- the migration seeded 5 role groupings, 58 atomic permissions and scoped role
  grants; PostgreSQL rejected audit update/delete operations,
- Drizzle metadata check passed; regeneration reported no schema change and
  produced no migration/snapshot Git diff,
- ESLint passed with zero warnings,
- TypeScript and Next.js route generation passed,
- Vitest: 16 files / 58 tests passed remotely, including 9 real PostgreSQL tests;
  exhaustive RBAC positives/negatives, production MFA denial, unscanned and
  unauthorized CV denial, scanner error/timeout/promotion fail-closed behavior,
  audit wiring/immutability, atomic rate limiting and PII redaction passed,
- production build passed with TR/EN static routes plus protected admin/internal
  security endpoints,
- local production HTTP checks: `/` → `307 /tr`, `/tr` and `/en` → `200`;
  with Auth0 intentionally unconfigured, `/admin` and `/auth/login` fail closed
  with `503` while public routes remain available,
- HTTP responses included HSTS, CSP with `frame-ancestors 'none'`, nosniff,
  Referrer-Policy, X-Frame-Options and Permissions-Policy,
- production dependency audit: no known vulnerabilities,
- implementation commit `92ea7ee3767c9bb10410d3b74476b057f9e9edb8` passed
  GitHub Actions `CI` run `#5` / run ID `32153073771`, attempt 1,
- HTTP-discovered Auth0 configuration fix commit
  `aec10f9cd0a9d9557115952d72c9f2ad0ded221d` passed final GitHub Actions `CI`
  run `#6` / run ID `32153677476`, attempt 1,
- final run URL:
  `https://github.com/radiatez/ardas_web_page/actions/runs/32153677476`.

Local note:

- the Windows host runtime was Node.js 24.14.0 and has no Docker/PostgreSQL
  service, so 9 DB integration tests were skipped locally; the authoritative
  clean-database execution used the pinned Node.js 24.19.0 + PostgreSQL 18.4 CI
  environment,
- local lint/typecheck/49 non-DB tests/build/audit, migration hash regeneration
  and production HTTP/header checks passed.

Provisioning / launch gates retained as `TBD`:

- Auth0 EU tenant creation, factor enablement, MFA `Always` verification, public
  registration disablement, admin bootstrap/recovery ownership,
- AWS S3 bucket/IAM/TBAC, GuardDuty plan/tagging, EventBridge → SQS/DLQ,
  scheduler and CloudWatch alert provisioning,
- Sentry/SES projects, alert recipients, DPA/subprocessor/legal review,
- approved candidate/contact/audit retention durations.

Public career/contact persistence remains intentionally unavailable until its
later milestone; Milestone 2 supplies and validates the security boundary only.

---

# Milestone 3 — Design System & Public Shell

Status: `[x]`

## Tasks

- [x] Implement design tokens.
- [x] Typography/grid/spacing.
- [x] Header/nav.
- [x] locale switcher.
- [x] Dealer Portal action.
- [x] footer.
- [x] responsive shell.
- [x] reduced-motion motion primitives.
- [x] media focal point + localized alt support.
- [x] localized 404/500.
- [x] legal route shell.

## Acceptance

- corporate design preserved,
- mobile/keyboard accessible,
- localized shell works.

### Validation Record — 2026-08-19

Authoritative remote environment:

```text
GitHub Actions ubuntu-latest
Node.js 24.19.0
pnpm 11.22.0
PostgreSQL 18.4 (official service image)
Next.js 16.3.1 / React 19.2.8
TypeScript 6.0.3 / Vitest 4.1.10
Testing Library React 16.3.2 / axe-core 4.13.0 / jsdom 30.0.1
```

Commands / CI gates:

```text
pnpm install --frozen-lockfile
pnpm run db:migrate
pnpm run db:check
pnpm run db:generate
git diff --exit-code -- drizzle
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
pnpm run audit:prod
```

Results:

- frozen install passed on the pinned remote runtime,
- clean PostgreSQL 18.4 migration, Drizzle metadata check and migration
  regeneration/no-diff gates passed; the Milestone 1–2 schema was unchanged,
- ESLint passed with zero warnings and TypeScript/Next.js route generation passed,
- Vitest passed remotely with 23 files / 79 tests, including 9 real PostgreSQL
  tests; local Windows execution passed 21 files / 70 non-DB tests with 9 DB
  tests skipped because no local PostgreSQL service was available,
- public-shell coverage includes TR/EN navigation and equivalent/fallback locale
  switching, Dealer Portal enabled/disabled/external-link behavior and proof that
  public presentation components contain no configured portal URL,
- accessibility coverage includes axe semantic checks, WCAG AA token contrast,
  visible-focus styling, mobile-menu focus trap/return/Escape, 44px targets,
  meaningful/decorative MediaLocale alt behavior and reduced-motion overrides,
- responsive contract checks passed for mobile-first 4/8/12-column layouts,
  40/64/80rem breakpoints, responsive media and the horizontal-overflow guard,
- production build passed; public routes are dynamic so the secure server-side
  Dealer Portal resolution is evaluated at request time,
- local production HTTP checks: `/` redirects to `/tr`; `/tr`, `/en`, localized
  legal routes and `/tr/unavailable` returned `200`; an unknown English route
  returned `404` with English system copy; the unlinked design-system preview
  returned `404` in production,
- production responses retained CSP, HSTS and Permissions-Policy security headers,
- production dependency audit reported no known vulnerabilities; the full
  development graph retains one moderate, development-only esbuild advisory under
  the pre-existing Drizzle Kit loader and has no high/critical advisory,
- implementation commit `eff4c40f2fff1353a6be37ddc5daf3ba86a95bc8`
  passed GitHub Actions `CI` run `#8` / run ID `32221814813`, attempt 1,
- run URL:
  `https://github.com/radiatez/ardas_web_page/actions/runs/32221814813`.

Local note:

- the Windows host runtime was Node.js 24.14.0 rather than the pinned 24.19.0;
  authoritative runtime and PostgreSQL validation used GitHub Actions,
- the in-app browser connection was blocked before page control by the installed
  browser plugin's trusted-code-path validation. No alternate browser automation
  surface was substituted. Production HTTP/render checks plus automated DOM,
  keyboard, axe, contrast, reduced-motion and responsive-contract tests passed;
  supported-browser visual regression remains part of the Milestone 8 matrix.

Scope retained:

- no homepage narrative sections were implemented; those remain Milestone 4,
- no business logic, data model, auth, RBAC, upload or retention behavior changed,
- final logo, palette, font, approved photography, exact contact information and
  approved legal copy remain explicit `TBD` launch gates.

---

# Milestone 4 — Homepage & Corporate Public Pages

Status: `[ ]`

## Canonical Narrative

```text
Impact
→ Scale
→ Capability
→ Portfolio / Brands
→ Distribution / Operations
→ Trust
→ People / Careers
→ Contact
```

## Tasks

- [ ] Homepage.
- [ ] Corporate.
- [ ] Brands.
- [ ] Product Groups.
- [ ] Locations.
- [ ] legal page rendering.
- [ ] bilingual/publication-aware CMS models connected.

## Acceptance

- public site looks corporate, not B2B/e-commerce,
- localized publication state respected,
- media alt TR/EN works.

---

# Milestone 5 — Public Contact & Career Persistence

Status: `[ ]`

## Contact

- [ ] fields/validation.
- [ ] privacy provenance.
- [ ] anti-abuse.
- [ ] persistence.
- [ ] notification/retry.

## Career

- [ ] required core fields incl. email.
- [ ] approval-gated fields/config.
- [ ] privacy provenance.
- [ ] PDF-only CV.
- [ ] quarantine/scan.
- [ ] protected persistence.
- [ ] notification/retry.

## Important Scope

Milestone 5 does **not** require completed Contact Manager inbox or HR management UI.

It proves secure public submission/persistence.

## Acceptance

- form records persist,
- privacy provenance stored,
- unsafe/unscanned CV inaccessible,
- notification failure does not lose record.

## Validation

Run E2E-02 through E2E-05 only.

---

# Milestone 6 — Admin CMS, Contact Inbox & Publishing

Status: `[ ]`

## Tasks

- [ ] dashboard.
- [ ] page/homepage CMS.
- [ ] brands/product groups/locations.
- [ ] departments.
- [ ] media.
- [ ] legal pages.
- [ ] SEO/settings.
- [ ] Contact Manager inbox.
- [ ] revisions.
- [ ] preview.
- [ ] direct editor publishing.
- [ ] scheduling.
- [ ] rollback.
- [ ] slug redirect management/history.

## Acceptance

- Editor can publish scoped public content,
- Contact Manager can manage messages,
- Viewer/Editor cannot read contact bodies,
- revision/rollback works.

## Validation

Run E2E-06 and E2E-07.

---

# Milestone 7 — HR Application Management

Status: `[ ]`

## Tasks

- [ ] application list/detail.
- [ ] search/filter.
- [ ] protected clean-PDF download.
- [ ] notes.
- [ ] status/history.
- [ ] HR audit scope.
- [ ] retention/delete/anonymize.
- [ ] future job-posting scaffold.

## Acceptance

- HR can manage applications,
- protected file access enforced,
- retention workflow works,
- HR cannot cross security boundaries.

## Validation

Run E2E-08 and E2E-09.

---

# Milestone 8 — Full Security, Accessibility, SEO, Performance & E2E

Status: `[ ]`

## Tasks

- [ ] full RBAC pass.
- [ ] upload/security review.
- [ ] MFA bypass review.
- [ ] dependency audit.
- [ ] CSP/headers.
- [ ] WCAG 2.2 AA.
- [ ] browser matrix.
- [ ] CWV optimization.
- [ ] sitemap/canonical/hreflang.
- [ ] full E2E suite.
- [ ] audit integrity checks.
- [ ] incident response tabletop/rotation test where practical.

## Acceptance

- no Critical unresolved risk,
- full test matrix passes,
- supported browsers/accessibility validated.

---

# Milestone 9 — Content, Domain/Email, Staging & Launch

Status: `[ ]`

## Tasks

- [ ] final logo/colors/fonts.
- [ ] company/legal content.
- [ ] real addresses/contact.
- [ ] brand assets/product taxonomy.
- [ ] approved imagery + rights.
- [ ] content inventory owners/approvers.
- [ ] approved legal pages.
- [ ] approved candidate/contact/audit retention durations.
- [ ] domain/DNS.
- [ ] SPF/DKIM/DMARC.
- [ ] email sender + recipients.
- [ ] analytics/cookie-consent decision.
- [ ] backups.
- [ ] restore test.
- [ ] monitoring.
- [ ] migration rehearsal.
- [ ] rollback rehearsal.
- [ ] staging sign-off.
- [ ] production launch.

## Acceptance

- no launch-gate TBD remains,
- legal/privacy/retention approved,
- email/domain healthy,
- restore verified,
- monitoring active.

---

# Open Provider Decisions

Choose/record during Milestone 0–1:

- exact Next.js/Node/pnpm/TypeScript versions,
- ORM,
- hosting,
- PostgreSQL hosting,
- object storage,
- auth/MFA,
- malware scanner,
- email,
- monitoring.

# Open Business/Legal Decisions

- exact legal company name,
- addresses,
- phones/emails,
- final brand identity,
- legal copy,
- candidate/contact/audit retention days,
- approval-gated career fields,
- analytics/cookie scope.
