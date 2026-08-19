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

Status: `[x]`

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

- [x] Homepage.
- [x] Corporate.
- [x] Brands.
- [x] Product Groups.
- [x] Locations.
- [x] legal page rendering.
- [x] bilingual/publication-aware CMS models connected.

## Acceptance

- public site looks corporate, not B2B/e-commerce,
- localized publication state respected,
- media alt TR/EN works.

### Validation Record — 2026-08-19

Local environment:

```text
Windows
Node.js 24.14.0 (host; project/CI pin is 24.19.0)
pnpm 11.22.0
Next.js 16.3.1 / React 19.2.8
TypeScript 6.0.3 / Vitest 4.1.10
Drizzle ORM 0.45.2 / Drizzle Kit 0.31.10
```

Commands / gates:

```text
pnpm install --frozen-lockfile
pnpm run db:check
pnpm run db:generate
git diff --exit-code -- drizzle
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
pnpm run audit:prod
production HTTP route/header/metadata checks
```

Results:

- frozen install passed with pnpm 11.22.0 and the committed lockfile,
- Drizzle metadata check passed; migration regeneration found no schema change
  and produced no `drizzle/` diff,
- ESLint passed with zero warnings; TypeScript and Next.js route generation passed,
- local Vitest passed 22 files / 81 tests with 3 PostgreSQL-dependent files /
  11 tests skipped because this Windows host has no PostgreSQL or Docker service,
- coverage includes bounded/versioned CMS parsing, route-key CTA allowlisting,
  explicit local-only TBD content, HTTPS media resolution/path hardening,
  localized alt/decorative semantics, published-locale metadata, locale-switch
  behavior and full-homepage axe semantics,
- production build passed with dynamic TR/EN homepage, corporate, brands,
  product-groups, locations, careers/contact CTA and legal routes plus dynamic
  publication-aware sitemap and robots output,
- local production HTTP checks returned `200` for all required TR/EN routes,
  `404` for an unknown localized route and `307` for `/` plus locale-switch
  resolution; placeholder routes contained canonical/hreflang metadata and
  remained `noindex`,
- HTTP responses retained HSTS, CSP `frame-ancestors 'none'`, nosniff,
  Referrer-Policy, X-Frame-Options and Permissions-Policy,
- automated responsive contract checks cover the mobile-first 4/8/12 grid,
  40/64/80rem breakpoints, reduced motion, focus behavior, responsive media and
  the horizontal-overflow guard,
- production dependency audit reported no known vulnerabilities.

Authoritative remote environment:

```text
GitHub Actions ubuntu-24.04
Node.js 24.19.0
pnpm 11.22.0
PostgreSQL 18.4 (official service image)
```

Remote validation:

- clean PostgreSQL 18.4 migration and Drizzle metadata checks passed; migration
  regeneration reported no schema change and produced no Git diff,
- ESLint, TypeScript/Next.js route generation and production build passed on the
  pinned Node.js 24.19.0 runtime,
- Vitest passed 25 files / 92 tests with all 11 PostgreSQL integration tests,
  including published-TR/draft-EN denial and localized slug-registry enforcement,
- frozen install and the production dependency audit passed with no known
  vulnerabilities,
- implementation commit `d6f83dcfcab9c323ae27595f6e530d84b9077a0a`
  passed GitHub Actions `CI` run `#10` / run ID `32224695146`, attempt 1,
- run URL:
  `https://github.com/radiatez/ardas_web_page/actions/runs/32224695146`.

Validation limitation:

- the installed in-app Browser plugin was blocked before page control by its
  trusted-code-path validation; no alternate browser automation surface was
  substituted. Automated DOM/axe/contrast/keyboard/responsive checks and real
  production HTTP rendering passed. Supported-browser visual/CWV validation
  remains in the Milestone 8 browser matrix.

Scope retained:

- no form persistence, admin/CMS UI, auth/RBAC, upload, retention or other
  business/security behavior changed,
- local/test placeholders are explicit `TBD` and `noindex`; staging/production
  have no placeholder fallback and direct unpublished locale access returns 404,
- approved brand list/product taxonomy, exact addresses/contact details, legal
  text, final identity and photography remain Milestone 9 launch gates.

---

# Milestone 4.1 — Visual Polish & Demo Media

Status: `[x]` — implementation and requested manual desktop/mobile review completed

## Scope

Visual polish and demo-media art direction only. No form, admin, auth/RBAC,
security, migration, data-model or Milestone 5 business logic changes.

## Tasks

- [x] Refine the provisional single accent without treating it as final identity.
- [x] Generate at least five coherent industrial/editorial demo images.
- [x] Keep demo assets replaceable and local/test-only.
- [x] Add Media/MediaLocale-compatible TR/EN alt, decorative and focal metadata.
- [x] Strengthen homepage hero, scale, portfolio, products, operations, trust,
      careers, contact and footer rhythm.
- [x] Polish corporate, brands, product-groups and locations page presentation.
- [x] Remove public-facing internal milestone language and reduce raw TBD surfaces
      without inventing business/legal facts.
- [x] Preserve publication, locale, SEO, sitemap, Dealer Portal and security boundaries.
- [x] Validate lint, typecheck, tests, production build, dependency audit,
      migration no-diff, accessibility and responsive contracts.
- [x] Complete the requested manual desktop/mobile visual review; screenshot
      artifacts are not a production blocker for this milestone.

## Validation Record — 2026-08-19

Local environment:

```text
Windows
Node.js 24.14.0 (host; project/CI pin is 24.19.0)
pnpm 11.22.0
Next.js 16.3.1 / React 19.2.8
TypeScript 6.0.3 / Vitest 4.1.10
Drizzle ORM 0.45.2 / Drizzle Kit 0.31.10
```

Commands / gates:

```text
pnpm install --frozen-lockfile
pnpm run db:check
pnpm run db:generate
git diff --exit-code -- drizzle
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
pnpm run audit:prod
production HTTP route/header/metadata/media checks
```

Results:

- frozen install passed with the committed lockfile,
- Drizzle metadata check passed; migration regeneration found no schema change
  and produced no `drizzle/` diff,
- ESLint passed with zero warnings; TypeScript and Next.js route generation passed,
- Vitest passed 23 files / 85 tests; 3 PostgreSQL-dependent files / 11 tests
  were skipped locally because this Windows host has no PostgreSQL or Docker,
- demo-media coverage verifies 6 workspace assets, stable IDs, file presence,
  focal bounds, local/test placement and meaningful/decorative TR/EN alt rules,
- full-homepage axe semantics, WCAG AA token contrast, reduced-motion and
  mobile-first overflow/responsive contracts passed,
- production build passed and the production dependency audit reported no known
  vulnerabilities,
- optimized local production HTTP checks returned `200` for required TR/EN
  homepage, corporate, brands, product-groups, locations, careers/contact and
  legal routes; an unknown localized route returned `404`, `/` returned `307 →
  /tr`, and the hero demo-media file returned `200 image/png`,
- placeholder pages retained `noindex`, canonical and TR/EN/x-default hreflang;
  public HTML contained the demo-media presentation but no internal Milestone 5
  copy or raw pending-media TBD label,
- a second production-mode server check denied both direct
  `/demo-media/warehouse-hero.png` and cached `/_next/image` optimizer access
  with empty `404` responses, proving that committed prototypes cannot become a
  public production fallback,
- responses retained CSP, HSTS, nosniff, Referrer-Policy, X-Frame-Options and
  Permissions-Policy.

Manual visual validation and retained backlog:

- desktop/mobile visual review was completed and accepted after the implementation
  validation; screenshot artifacts are not a production blocker,
- small mobile typography refinements, footer polish, header/navigation ratios,
  final logo/font/color and real approved Ardaş photography remain explicitly in
  the post-implementation visual-polish backlog and were not reopened in
  Milestone 5.

Remote validation:

- implementation commit `a9c6b706948a272fe633ca4bfa6b8da063654bd1`
  passed GitHub Actions `CI` run `#12` / run ID `32228443044`, attempt 1,
- the pinned Node.js 24.19.0 + PostgreSQL 18.4 job passed frozen install,
  clean migration, regeneration/no-diff, lint, typecheck, all 96 tests,
  production build and dependency audit,
- run URL:
  `https://github.com/radiatez/ardas_web_page/actions/runs/32228443044`.

Scope retained:

- no form persistence, admin/CMS UI, auth/RBAC, upload, retention, database schema
  or other business/security behavior changed,
- generated imagery is not represented as real Ardaş facilities, employees,
  inventory, approved photography or production CMS media,
- final logo, palette, font, imagery rights, brand list, product taxonomy,
  exact addresses/contact information and legal content remain launch gates.

---

# Milestone 5 — Public Contact & Career Persistence

Status: `[x]`

## Contact

- [x] fields/validation.
- [x] privacy provenance.
- [x] anti-abuse.
- [x] persistence.
- [x] notification/retry.

## Career

- [x] required core fields incl. email.
- [x] approval-gated fields/config.
- [x] privacy provenance.
- [x] PDF-only CV.
- [x] quarantine/scan.
- [x] protected persistence.
- [x] notification/retry.

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

## Validation Record — 2026-08-19

Local environment:

```text
Windows
Node.js 24.14.0 (host; project/CI pin is 24.19.0)
pnpm 11.22.0
Next.js 16.3.1 / React 19.2.8
TypeScript 6.0.3 / Vitest 4.1.10
PostgreSQL 18.4 (GitHub Actions service; no local PostgreSQL/Docker)
Drizzle ORM 0.45.2 / Drizzle Kit 0.31.10
```

Commands / gates:

```text
pnpm install --frozen-lockfile
pnpm run db:check
pnpm run db:generate
git diff --exit-code -- drizzle
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
pnpm run audit:prod
production HTTP route/header/unavailable-state checks
```

Local results:

- frozen install passed with the committed lockfile; Drizzle metadata check passed
  and regeneration reported no schema changes,
- ESLint passed with zero warnings; Next.js route generation and TypeScript passed,
- Vitest passed 25 files / 100 tests; 4 PostgreSQL-dependent files / 18 tests
  were skipped locally because this Windows host has no PostgreSQL or Docker,
- automated axe form/shell semantics, label/required/error associations, failed
  submit focus, success announcement, conditional input behavior, WCAG AA token
  contrast, reduced motion and mobile overflow contracts passed,
- E2E-02 through E2E-05 are covered by the form, security and PostgreSQL
  integration suites: clean CV promotion, unauthorized/unscanned denial,
  conditional fields and contact persistence/notification attempt,
- production build passed; the production dependency audit reported zero known
  vulnerabilities,
- local production HTTP checks returned `200` for TR/EN home, contact, careers
  and career-apply routes, `404` for an unknown localized path and `307 → /tr`
  for `/`; security headers remained present,
- with form/provider settings intentionally absent, contact and career form routes
  rendered their localized unavailable shell while `/tr` and `/en` remained
  available, confirming the independent fail-closed production gate.

Remote validation:

- implementation commit `8794fb23abbf9fc2ebcc805c72b130c0cf07670f`
  passed GitHub Actions `CI` run `#15` / run ID `32234755718`, attempt 1,
- pinned Node.js 24.19.0 + PostgreSQL 18.4 passed frozen install, clean
  migration, metadata check, regeneration/no-diff, lint and typecheck,
- all 29 test files / 118 tests passed; 4 real PostgreSQL integration files /
  18 PostgreSQL tests covered schema/migration constraints, locale publication,
  RBAC/security boundaries, contact persistence, career quarantine/clean/infected
  transitions, idempotency, notification failure retention and orphan cleanup,
- production build passed and the production audit reported zero known
  vulnerabilities,
- run URL:
  `https://github.com/radiatez/ardas_web_page/actions/runs/32234755718`.

Scope retained:

- no HR management screen, Contact Manager inbox, admin CMS module or Milestone 6
  work was added,
- approved legal text, retention durations, production recipient addresses and
  provider credentials/resources remain configuration/launch gates,
- the Milestone 4.1 visual-polish backlog remains unchanged.

---

# Milestone 6 — Admin CMS, Contact Inbox & Publishing

Status: `[x]`

## Tasks

- [x] dashboard.
- [x] page/homepage CMS.
- [x] brands/product groups/locations.
- [x] departments.
- [x] media.
- [x] legal pages.
- [x] SEO/settings.
- [x] Contact Manager inbox.
- [x] revisions.
- [x] preview.
- [x] direct editor publishing.
- [x] scheduling.
- [x] rollback.
- [x] slug redirect management/history.

## Acceptance

- Editor can publish scoped public content,
- Contact Manager can manage messages,
- Viewer/Editor cannot read contact bodies,
- revision/rollback works.

## Validation

Run E2E-06 and E2E-07.

## Validation Record — 2026-08-19

Authoritative remote environment:

- GitHub Actions Ubuntu runner,
- Node.js `24.19.0`,
- pnpm `11.22.0`,
- PostgreSQL `18.4` service container,
- implementation commit `9311a97a0f2a87cb2cea3f879124c3fc63931b6b`,
- workflow run `32240506160`, job `96029784593`: passed.

Local environment:

- Windows / PowerShell,
- Node.js `24.14.0` and pnpm `11.19.0`; both are below the repository-pinned
  `24.19.x` / `11.22.x`, so the remote result is authoritative for the frozen
  runtime gate.

Commands and results:

- frozen install: `pnpm install --frozen-lockfile` passed locally with the
  expected engine warning; the pinned-runtime CI install passed without drift,
- clean database migration: all migrations through `0004_bumpy_invaders.sql`
  applied to a clean PostgreSQL 18.4 database in CI,
- migration reproducibility: `pnpm db:check` passed, `pnpm db:generate`
  reported no schema changes, and CI reproduced the expected 32-table schema,
- lint: `pnpm lint` passed with zero warnings,
- typecheck: `pnpm typecheck` passed,
- test: local non-PostgreSQL run passed 104 tests and skipped 21 database tests;
  CI passed all 125 tests in 32 files,
- real PostgreSQL tests: 21 tests in 5 files passed, including CMS
  draft/preview/publish/schedule/rollback, localized publication and redirect,
  contact access/status/note/retention, migration and security integration,
- E2E-06 CMS Publishing: the PostgreSQL-backed flow covers Editor draft → secure
  localized preview → direct publish → schedule → rollback with revision and
  audit assertions,
- E2E-07 Contact Manager: the PostgreSQL-backed flow covers minimal list/detail,
  status/note/retention mutations and positive Contact Manager plus negative
  Viewer/Content Editor access assertions,
- production build: `pnpm build` passed; admin, CMS mutation, preview, public
  media and internal scheduler routes were emitted successfully,
- dependency audit: `pnpm audit:prod` passed with no known vulnerabilities,
- HTTP route checks after the production build: `/` returned `307` to `/tr`;
  `/tr`, `/en` and `/tr/iletisim` returned `200`; an unknown localized route
  returned `404`; unconfigured `/admin` and preview access failed closed with
  `503`; an unauthorized scheduler request returned `401`,
- security headers: CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy` and
  `Permissions-Policy` were present in the production HTTP checks,
- accessibility: the Turkish admin shell passed its automated axe check; public
  accessibility, keyboard/focus and localized shell regressions remained green,
- remote CI: every job step passed, including frozen install, clean migration,
  schema check/reproducibility, lint, typecheck, test, production build and
  production dependency audit.

Implemented scope:

- Turkish, permission-aware admin dashboard and scoped CMS modules for homepage,
  corporate/legal pages, brands, product groups, locations, departments, careers
  content, public media, SEO and non-secret site settings,
- structured working drafts separated from live locale rows; secure noindex
  preview; direct editor publishing; scheduling and scheduled archive; immutable
  revisions; rollback as a new draft; audit-backed localized slug redirects,
- Contact Inbox access limited to Super Admin / Contact Manager, with minimal-PII
  list projection, protected detail, filters, status, notes and configurable
  retention/anonymization foundation,
- public-media-only CMS handling; protected/quarantine CV storage and all
  Milestone 5 form/security boundaries remain unchanged,
- no HR/candidate-management user interface and no Milestone 7 work was added.

Production gates retained:

- Auth0 EU tenant configuration and production MFA-policy evidence,
- production S3, scheduler invocation, alerts/monitoring and other provider
  resources/credentials,
- approved legal text/reference, final contact/candidate retention durations,
  final corporate content and licensed media,
- nonce/hash-based CSP hardening tracked by risk `R-028`.

---

# Milestone 7 — HR Application Management

Status: `[x]`

## Tasks

- [x] application list/detail.
- [x] search/filter.
- [x] protected clean-PDF download.
- [x] notes.
- [x] status/history.
- [x] HR audit scope.
- [x] retention/delete/anonymize.
- [x] future job-posting scaffold.

## Acceptance

- HR can manage applications,
- protected file access enforced,
- retention workflow works,
- HR cannot cross security boundaries.

## Validation

Run E2E-08 and E2E-09.

## Validation Record — 2026-08-19

Local environment:

- Windows / PowerShell,
- Node.js `24.14.0` host runtime; repository/CI pin remains `24.19.x`,
- pnpm `11.22.0` through Corepack,
- Docker Engine client/server `29.7.2`, Docker Compose `5.4.0`,
- official PostgreSQL `18.4` image through disposable `compose.test.yaml`.

Commands and results:

- frozen install: `corepack pnpm install --frozen-lockfile` passed with the
  committed lockfile; the expected local Node engine warning was retained,
- repeatable database test lifecycle: `corepack pnpm run test:postgres` started
  isolated `ardas-test-postgres-test-1` on `127.0.0.1:55432`, waited for health,
  applied migrations, checked metadata, ran the complete suite and removed the
  container, network and temporary database data,
- migration validation: all committed migrations through
  `0004_bumpy_invaders.sql` applied to clean PostgreSQL 18.4 and produced the
  expected 32-table schema,
- migration reproducibility: `pnpm db:check` passed, `pnpm db:generate` reported
  no schema change and `git diff --check` passed,
- lint: `pnpm lint` passed with zero warnings,
- typecheck: `pnpm typecheck` and Next.js route generation passed,
- tests: 34 files / 130 tests passed; 6 files / 25 tests exercised real
  PostgreSQL integration,
- PostgreSQL coverage includes server-filtered/paginated list queries, minimal
  projection, protected detail, notes, allowed/denied status transitions,
  history, career-scoped audit, due/hold retention, anonymization, hard-delete
  override, protected Media/application relation and existing migrations,
- E2E-08 passed: HR list → detail → clean protected CV download → internal note
  → valid status/history → retention/anonymization → PII-safe audit,
- E2E-09 passed: Content Editor, Contact Manager and Viewer list/detail/CV
  access denied; HR Dealer Portal, users/roles and Contact Inbox access denied;
  Super Admin HR operations allowed,
- CV fail-closed matrix passed: authorized HR + clean/protected allowed;
  pending, quarantine, error, infected, missing result, unrelated clean file,
  non-MFA and unauthorized-role access denied,
- retention passed: HR `retention` scope cannot bypass a future deadline or
  active hold; due anonymization clears PII/notes, deletes the CV object/Media,
  archives the neutral row and preserves status/audit history; hard delete and
  early override require `all` scope,
- accessibility: the HR action controls passed axe semantics; labels, status and
  note controls, destructive alert-dialog focus entry, Tab containment, Escape
  close and focus return passed automated checks,
- production build: `pnpm build` passed and emitted `/admin/basvurular`, its
  protected detail route, HR mutation API and existing clean-CV endpoint,
- dependency audit: `pnpm audit:prod` passed with no known vulnerabilities,
- production HTTP smoke: `/` returned `307 → /tr`, `/tr` returned `200`, and
  both HR list/detail routes failed closed with `503` while Auth0 configuration
  was intentionally absent; CSP, HSTS, nosniff, Referrer-Policy,
  frame-ancestor/X-Frame-Options and Permissions-Policy remained present.

Authoritative remote environment:

- GitHub Actions Ubuntu runner,
- Node.js `24.19.0`, pnpm `11.22.0`, PostgreSQL `18.4`,
- implementation commit `119ccdb9e784b50a26ec68adf2c6dd6f9c704da7`,
- workflow `CI` run `#19`, run ID `32245084620`, attempt 1, job
  `96043753945`: success,
- every step passed: frozen install, clean migration, metadata check,
  migration regeneration/no-diff, lint, typecheck, 34 files / 130 tests,
  production build and dependency audit,
- 6 PostgreSQL files / 25 PostgreSQL tests passed remotely, matching the local
  Docker database behavior,
- run URL:
  `https://github.com/radiatez/ardas_web_page/actions/runs/32245084620`.

Implemented scope:

- Turkish, responsive and keyboard-oriented HR list/detail UI using the existing
  Milestone 6 admin visual language,
- server-side bounded name/date/status/department/location/application-kind
  filters and pagination; the list omits phone, email, salary and free text,
- explicit permission/scope authorization, forward-only status graph,
  note/history/audit, clean protected CV download, privacy provenance and
  due/hold-aware retention operations,
- nullable `job_posting_id` and General Application remain supported without
  introducing a full recruitment/job-posting system,
- Milestone 6 CMS/Contact Inbox, public forms, Auth0/MFA, S3/GuardDuty and
  production provider decisions remain unchanged; Milestone 8 was not started.

Production gates retained:

- Auth0 EU tenant provisioning and MFA Always evidence,
- S3/GuardDuty/EventBridge/SQS resources, IAM, alarms and protected-object
  deletion/reconciliation monitoring,
- approved candidate retention days, legal-hold/override operating policy and
  approved privacy/legal text,
- Neon/Vercel/SES/Sentry/CloudWatch provisioning, DPA/subprocessor review,
  owners, alert recipients and credentials,
- nonce/hash CSP hardening (`R-028`), provider-side PII scrubbing, backups and
  restore/retention rehearsals.

---

# Milestone 8 — Full Security, Accessibility, SEO, Performance & E2E

Status: `[x]`

## Tasks

- [x] full RBAC pass.
- [x] upload/security review.
- [x] MFA bypass review.
- [x] dependency audit.
- [x] CSP/headers.
- [x] WCAG 2.2 AA.
- [x] browser matrix.
- [x] CWV optimization.
- [x] sitemap/canonical/hreflang.
- [x] full E2E suite.
- [x] audit integrity checks.
- [x] incident response tabletop/rotation test where practical.

## Acceptance

- no Critical unresolved risk,
- full test matrix passes,
- supported browsers/accessibility validated.

## Validation Record — 2026-08-19

Local integration environment:

```text
Windows / PowerShell
Node.js 24.14.0 host (repository/CI pin: 24.19.x)
pnpm 11.22.0 via Corepack
Next.js 16.3.1 / React 19.2.8
Docker Engine 29.7.2 / Docker Compose 5.4.0
PostgreSQL 18.4 official disposable image
Playwright 1.62.1 / axe-core Playwright 4.13.0
```

Repeatable validation:

- frozen `pnpm install --frozen-lockfile`: passed; lockfile unchanged,
- `pnpm test:integration`: passed from clean disposable PostgreSQL start through
  migration, full regression, production build, browser matrix, restore drill,
  rollback contract and automatic cleanup,
- Drizzle migration apply/check/generate: passed; 5 committed migrations and no
  generated migration diff,
- lint and typecheck: passed with zero warnings/errors,
- Vitest: 36 files / 139 tests passed; 7 PostgreSQL integration files / 27
  PostgreSQL tests included,
- production build: passed,
- Playwright: 35 project/test registrations; 24 passed and 11 intentional
  project-guard skips across Chromium, Firefox, WebKit, Pixel 7/Android Chrome
  and iPhone 15/iOS Safari-equivalent profiles,
- automated axe WCAG 2.2 AA serious/critical violations: 0 on localized public,
  form, 404, admin CMS and HR presentation paths,
- responsive matrix: 320×720, 390×844, 768×1024, 1440×900 and 1920×1080;
  no horizontal overflow,
- strict per-request nonce/hash CSP: public, forms, media, preview/admin
  fail-closed contracts and Auth0 nonce/redirect contract passed; no
  `unsafe-inline` or `unsafe-eval`; R-028 mitigated,
- security regression: 58-permission RBAC matrix, cross-module denials,
  MFA/session/open-redirect, CV fail-closed matrix, form/input/XSS, immutable
  audit and PII log-redaction tests passed,
- SEO regression: canonical/hreflang, sitemap/robots, localized 404, 301 slug
  history, noindex private/preview/test surfaces and unpublished omission passed,
- local lab baseline (not field p75): CLS `0`, LCP `136 ms`, delivered JS
  `150,554 bytes`; field CWV monitoring remains a production gate,
- `pnpm run drill:recovery`: custom-format `pg_dump`/`pg_restore`, migration
  journal, critical fixture and post-restore retention cleanup passed,
- `pnpm run validate:rollback`: procedure contract passed; all 5 migrations
  contain no database drop/truncate rollback operation,
- production dependency audit: 0 known vulnerabilities; Playwright/axe versions
  are exact and pnpm lifecycle builds remain allowlisted,
- post-run Docker inspection: 0 `ardas-test` containers, networks or volumes.

Remote validation:

- implementation commit `60299fac9528e669b0290d4e66c0464b2594f2ed`,
- GitHub Actions Ubuntu runner, Node.js `24.19.0`, pnpm `11.22.0` and
  PostgreSQL `18.4`,
- CI run `32249875762` passed all steps, including frozen install, migration
  reproducibility, lint, typecheck, 139 tests, build, production audit,
  Chromium/Firefox/WebKit installation and regression, backup/restore and
  rollback validation:
  `https://github.com/radiatez/ardas_web_page/actions/runs/32249875762`.

Production gates intentionally retained for Milestone 9:

- Auth0 EU tenant plus MFA Always evidence; Neon, S3/IAM,
  GuardDuty/EventBridge/SQS, SES and Sentry/CloudWatch provisioning,
- provider-side PII scrubbing, DPA/data-region approval, approved legal text and
  retention days, production backup schedule/PITR rehearsal and live alerts,
- field CWV p75 evidence and final approved identity/content/media.

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
