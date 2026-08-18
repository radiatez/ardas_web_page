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
