# Test Matrix v0.3

## Quality Targets

### Accessibility
WCAG 2.2 AA.

### Browsers
- latest 2 stable Chrome
- latest 2 stable Edge
- latest 2 stable Firefox
- latest 2 stable Safari
- current iOS Safari
- current Android Chrome

### Core Web Vitals p75
- LCP ≤ 2.5s
- INP ≤ 200ms
- CLS ≤ 0.10

## Core Matrix

| Area | Test |
|---|---|
| Scaffold | pnpm install from clean checkout |
| Build | lint/typecheck/test/build |
| Locale | `/` → `/tr` |
| Locale | localized route mapping |
| Locale | unpublished locale → 404 |
| Locale | language switch equivalent/fallback |
| Slug | old published slug → 301 current slug |
| SEO | canonical/hreflang/sitemap |
| Admin Auth | anonymous denied |
| Admin Auth | MFA required in production |
| RBAC | positive/negative role permissions |
| RBAC | direct API/server action denial |
| Contact RBAC | Viewer denied |
| Contact RBAC | Content Editor denied |
| Contact RBAC | Contact Manager allowed |
| Dealer Portal | HTTP rejected |
| Dealer Portal | unauthorized role rejected |
| Dealer Portal | change audited |
| Career | required first/last/phone/email |
| Career | required department/location/salary/availability/about/CV |
| Career | optional approval-gated fields disabled safely |
| Career | Male → military conditional when enabled |
| Career | Deferred → date conditional when enabled |
| Career | knows-company Yes → source |
| Career | null `job_posting_id` accepted |
| Privacy | locale + notice version/timestamps persisted |
| Legal content | temporary metadata/version/admin status enforced |
| Legal content | substantive TR/EN pages have no public placeholder/banner |
| Legal content | approved copy requires new version + approval reference |
| Legal seed | idempotent PostgreSQL seed + immutable revision |
| Privacy | acknowledgement is not explicit consent |
| Privacy | historic submission retains the notice version shown |
| Privacy | temporary/review-required notice cannot enable production form |
| CV | non-PDF rejected |
| CV | over 10MB rejected |
| CV | MIME/signature mismatch rejected |
| CV | scan pending unavailable → inaccessible |
| CV | infected → rejected/quarantined |
| CV | clean + authorized HR → download |
| CV | unauthorized download denied |
| Contact | privacy provenance persisted |
| Contact | spam/rate limit |
| Notifications | email failure does not lose persisted form |
| Logs | no raw PII/CV content |
| Retention | candidate cleanup |
| Retention | contact cleanup |
| Content | draft not public |
| Content | preview protected |
| Content | scheduled publication |
| Content | rollback revision |
| Content | BrandLocale status respected |
| Content | ProductGroupLocale status respected |
| Content | LocationLocale status respected |
| Content | JobPostingLocale status respected |
| Media | TR/EN alt text |
| Accessibility | keyboard/focus/forms/reduced motion |
| Errors | localized 404/500 |
| Incident | secret rotation procedure is documented/testable |
| Email | SPF/DKIM/DMARC configured before production |

## Critical E2E by Milestone

### Milestone 3–4
**E2E-01 Public Corporate Navigation**

TR → public route → language switch → EN equivalent.

### Milestone 5
**E2E-02 Career Persistence**

Valid general application + clean PDF:

```text
submit
→ persisted application
→ protected clean file
```

Do NOT require HR UI yet.

**E2E-03 Career Negative Security**

Unauthorized access to protected/application endpoints denied.

**E2E-04 Conditional Career Validation**

Exercise enabled conditional branches.

**E2E-05 Contact Persistence**

Submit contact:

```text
submit
→ persisted
→ notification attempted
```

Do NOT require admin inbox UI yet.

### Milestone 6
**E2E-06 CMS Publishing**

Editor draft → preview → publish → schedule → rollback.

**E2E-07 Contact Manager**

Contact Manager sees/updates message; Viewer/Editor denied.

### Milestone 7
**E2E-08 HR Application Management**

HR sees application → protected CV download → note/status → retention workflow.

**E2E-09 HR Negative Permission**

HR cannot modify Dealer Portal/site security settings.

### Milestone 8
Run all critical E2Es together across supported environment.

## Milestone 8 Full Regression Record — 2026-08-19

| Gate | Result |
|---|---|
| Frozen install | Passed; exact lockfile |
| PostgreSQL | Official 18.4 disposable service; migrations/check/reproducibility passed |
| Vitest | 36 files / 139 tests passed |
| Real PostgreSQL subset | 7 files / 27 tests passed |
| E2E-01 → E2E-09 | Passed together on one migrated schema/build |
| Browser matrix | Chromium, Firefox, WebKit, Pixel 7 and iPhone 15 profiles passed |
| Playwright registrations | 24 passed; 11 intentional project-guard skips; 35 total |
| Accessibility | axe serious/critical violations 0; keyboard, skip-link, drawer/dialog focus passed |
| Responsive | 320, 390, 768, 1440 and 1920 widths; no horizontal overflow |
| CSP/headers | Nonce/hash strict policy, private no-store and Auth0 nonce/redirect contract passed |
| Security | 58-permission matrix, cross-module API denials, MFA/session, CV/form/XSS/log/audit passed |
| SEO | canonical, hreflang, sitemap, robots, 301, localized 404 and noindex contracts passed |
| Lab diagnostic | CLS 0; LCP 136 ms; JS 150,554 bytes; not field p75 |
| Recovery | Portable backup/restore plus post-restore retention cleanup passed |
| Cleanup | No disposable container, network or volume remained |

The admin browser path is an isolated presentation fixture using the real CMS
and HR controls. It contains no credentials, session bypass or personal data,
requires two explicit test-only environment gates, is noindex/robots-disallowed
and returns 404 when either gate is absent. Authorization and E2E-06 through
E2E-09 remain exercised against the server services and real PostgreSQL tests.

## Milestone 9 Final Regression Record — 2026-08-19

| Gate | Result |
|---|---|
| Frozen install | Passed; exact lockfile, pnpm 11.22.0 |
| PostgreSQL | Official 18.4 disposable service; 5 migrations, 32 tables, check/reproducibility passed |
| Production seed | 12 structural + 10 temporary legal/form locale rows; second run preserved 22/22 |
| Vitest | 39 files / 156 tests passed on real PostgreSQL |
| PostgreSQL-gated subset | 9 files / 33 tests passed |
| E2E-01 → E2E-09 | Passed together on the final migrated and seeded schema/build |
| Browser matrix | Chromium, Firefox, WebKit, Android Chrome and iOS Safari profiles passed |
| Playwright registrations | 29 passed; 11 intentional project-guard skips; 40 total |
| Accessibility | axe serious/critical violations 0; keyboard, focus, reduced motion passed |
| Responsive | 320, 390, 768, 1440 and 1920 widths; no horizontal overflow |
| Security | 58-permission RBAC, CSP, MFA/session, CV fail-closed, XSS, PII log and audit passed |
| SEO/public routes | All 22 required TR/EN routes plus the root redirect, canonical, hreflang, sitemap, robots, 301 and errors passed |
| Lab diagnostic | CLS 0; LCP 120 ms; JS 150,484 bytes; not field p75 |
| Recovery/rollback | Portable restore, retention reconciliation and 5-migration rollback contract passed |
| Dependency audit | 0 known production vulnerabilities |
| Cleanup | No disposable container, network or volume remained |
