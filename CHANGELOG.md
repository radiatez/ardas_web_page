# Changelog

## Unreleased — Milestone 0 Application Scaffold

- Confirmed `ardas_web_page` as the application repository root.
- Pinned Node.js, pnpm, Next.js, React, TypeScript, ESLint and Vitest versions.
- Added Next.js App Router scaffold with `/` → `/tr`, `/tr` and `/en`.
- Added a temporary `noindex` bilingual Milestone 0 surface using approved facts only.
- Added strict TypeScript, ESLint, Vitest and production build commands.
- Added frozen pnpm lockfile and dependency build-script allowlist.
- Selected Drizzle ORM/Kit and PostgreSQL migration baseline.
- Added safe environment examples for local/staging/production.
- Added GitHub Actions CI for install, lint, typecheck, test and build.
- Verified production dependencies with no known audit vulnerabilities.

## v0.3 — Data Model, RBAC, Legal Routes & Security Hardening

This version incorporates the second full project review.

### Architecture / Planning

- Fixed milestone order: framework/package-manager/database baseline is selected before scaffold.
- Locked baseline:
  - Next.js
  - TypeScript
  - pnpm
  - PostgreSQL
- Provider choices (hosting, DB hosting, object storage, auth, email) remain implementation-time architecture decisions.
- Split Milestone 5 validation so public form persistence is tested before Admin/HR management E2Es.
- Moved inbox/HR management E2Es to the milestones where those admin modules exist.

### Internationalization / Publishing

- Added locale publication fields to:
  - `BrandLocale`
  - `ProductGroupLocale`
  - `LocationLocale`
  - `JobPostingLocale`
  - `MediaLocale`
- Added `MediaLocale` for localized alt text/caption.
- Added slug history / 301 redirect model.
- Added localized public legal routes.
- Confirmed initial publishing model: authorized content editors can publish directly; no second approver is mandatory in v1.
- Revision history, preview, rollback, scheduling and audit remain mandatory.

### Career / Contact

- Added candidate email.
- Explicitly marked core career fields required.
- Gender, birth date, marital status and military information remain approval-gated.
- Initial CV policy changed to:
  - PDF only
  - max 10 MB
  - malware scanning mandatory
  - fail-closed quarantine if scanner unavailable/fails
- Added form provenance fields:
  - locale
  - privacy notice version
  - notice shown timestamp
  - acknowledgement timestamp where applicable
- Added equivalent provenance to contact submissions.

### RBAC / Admin

- Added `contact_manager` role.
- Removed contact-message access from generic `viewer`.
- Removed broad contact access from `content_editor`.
- MFA is mandatory for admin users before production.
- Added explicit publishing permissions and clarified that Content Editor may publish public content in v1.

### Security / Operations

- Added incident response and secret/key rotation procedure.
- Added audit retention/integrity policy.
- Added domain/DNS/email operations plan.
- Added content inventory / owner / approver tracking.
- Added public legal-pages requirements.
- Added Department/DepartmentLocale entities instead of hard-coded department enum.
- Fixed broken Next.js → I18N document path.
- Normalized homepage narrative to one canonical sequence.

## v0.2

Architecture, security and execution hardening.
