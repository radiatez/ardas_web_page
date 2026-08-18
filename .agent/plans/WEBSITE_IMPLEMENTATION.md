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

Status: `[ ]`

## Tasks

- [ ] Select hosting, PostgreSQL hosting, object storage, auth/MFA, email, monitoring providers.
- [ ] Document data regions.
- [ ] Implement stable route keys + localized slugs.
- [ ] `/` → `/tr`.
- [ ] Implement unpublished locale 404.
- [ ] Implement switch fallback.
- [ ] Implement SlugRedirect.
- [ ] Implement locale-aware publication on all localized entities.
- [ ] Implement Department/DepartmentLocale.
- [ ] Implement MediaLocale.
- [ ] Implement form privacy provenance fields.
- [ ] Configure DB/migrations.
- [ ] Define public/protected/quarantine storage classes.
- [ ] Record provider/architecture ADRs.

## Acceptance

- clean DB migration works,
- all localized public entities have publication state,
- route/slug rules pass tests,
- privacy provenance exists in schema,
- Department is managed data,
- storage classes exist.

## Validation

Migration tests, locale tests, data-model checks.

---

# Milestone 2 — Security Foundation: MFA, RBAC, Audit, Upload & Retention

Status: `[ ]`

## Tasks

- [ ] Admin authentication.
- [ ] MFA mandatory in production.
- [ ] Server permission framework.
- [ ] Implement RBAC incl. Contact Manager.
- [ ] Audit foundation + integrity policy.
- [ ] Protected/quarantine CV storage.
- [ ] PDF-only 10MB validation.
- [ ] Mandatory malware scanner.
- [ ] Fail-closed scan behavior.
- [ ] Protected CV download.
- [ ] Rate limiting.
- [ ] PII-safe logging.
- [ ] Retention cleanup mechanism.
- [ ] Dealer Portal secure setting.
- [ ] Security headers/error baseline.
- [ ] Incident-response/secret-rotation operational hooks.

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

---

# Milestone 3 — Design System & Public Shell

Status: `[ ]`

## Tasks

- [ ] Implement design tokens.
- [ ] Typography/grid/spacing.
- [ ] Header/nav.
- [ ] locale switcher.
- [ ] Dealer Portal action.
- [ ] footer.
- [ ] responsive shell.
- [ ] reduced-motion motion primitives.
- [ ] media focal point + localized alt support.
- [ ] localized 404/500.
- [ ] legal route shell.

## Acceptance

- corporate design preserved,
- mobile/keyboard accessible,
- localized shell works.

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
