# Production Readiness

This is the final source of truth for the distinction between completed software
implementation and external go-live provisioning. An item in
`BLOCKED_EXTERNAL` does not reopen Milestone 9; it prevents only the affected
production capability or launch approval.

# READY

- **Next.js application:** production build, pinned Node/pnpm contract, Vercel
  `fra1` configuration and frozen install/build commands.
- **PostgreSQL:** PostgreSQL 18-compatible Drizzle schema, five committed
  migrations, clean-database application, reproducibility check, pooled runtime /
  direct migration URL split and bounded application pool.
- **Production seed:** idempotent, preservation-first structural/temporary legal
  seed; no fake admin, candidate, contact, brand, certificate or legal identity.
- **Docker integration:** isolated PostgreSQL `18.4` migration/seed/test/recovery
  lifecycle with guaranteed container/network/volume cleanup.
- **Internationalization:** localized stable routes, `/tr` and `/en`, localized
  publication, language switching, 301 slug redirects, 404/error states,
  canonical and hreflang behavior.
- **Public site:** responsive corporate shell and all required TR/EN routes,
  localized metadata, sitemap/robots, Dealer Portal resolution and verified
  structural fallback when public providers are unavailable.
- **Design/media:** tokenized `#006B63` accent, replaceable ARDAŞ wordmark,
  accessible responsive media and six project-generated unbranded temporary
  assets explicitly marked `temporaryMedia=true` and
  `requiresReplacement=true`.
- **CMS:** pages, homepage, corporate content, brands, product groups, locations,
  departments, careers, legal pages, SEO, MediaLocale and Site Settings.
- **Publishing:** protected preview, working copies, immutable revisions, direct
  publish, scheduled transitions, rollback-as-new-revision and slug redirect.
- **Contact:** localized form, privacy provenance, server validation, body/rate
  controls, transactionally persisted outbox and permission-separated inbox.
- **Career/HR:** localized general application, department/location options,
  privacy provenance, candidate workflow, notes/status history, retention /
  anonymization/delete mechanisms and protected CV relation.
- **RBAC:** 58 atomic permission/scope expectations and named positive/negative
  domain boundaries enforced server-side; roles are grant groupings only.
- **Authentication/MFA contract:** Auth0 EU adapter, no public registration,
  secure/private session boundary and mandatory production MFA checks; incomplete
  provider configuration fails closed.
- **CV security:** PDF-only, 10 MiB, extension/MIME/signature validation, random
  key, quarantine, GuardDuty/SQS event handling, clean/protected promotion and
  authenticated + MFA + permission + relation-checked download.
- **Security headers:** per-request CSP nonce, `strict-dynamic`, no global
  `unsafe-inline`/`unsafe-eval`, HSTS, frame, referrer, MIME and permissions
  policies. Risk R-028 remains mitigated.
- **Audit/logging:** real security/admin mutations linked to PII-safe audit;
  application structured logs redact personal data, free text, tokens,
  credentials, filenames and CV content before output.
- **Temporary legal lifecycle:** substantive TR/EN public pages and form notices
  at `TEMP-2026-08-V1`, `temporary`, `requires_legal_review=true`; admin warning,
  noindex, immutable revision/provenance and approved-version production gate.
- **Accessibility/responsive:** WCAG 2.2 AA target, axe, keyboard/focus,
  reduced-motion, overflow and 320/390/768/1440/1920 regression automation.
- **SEO:** canonical, hreflang, robots, sitemap, localized metadata and redirect
  contracts covered by tests.
- **Browser matrix:** Chromium, Firefox, WebKit, Android Chrome profile and iOS
  Safari profile through Playwright production-build tests.
- **Backup/restore contract:** portable PostgreSQL `pg_dump`/`pg_restore`,
  migration-journal verification and post-restore retention reconciliation
  validated locally; production expectations documented.
- **Deployment/runbooks:** release order, migration, seed, smoke, rollback,
  domain/email, monitoring, AWS file flow and fail-closed feature gates are
  documented. Application software implementation is complete.

# BLOCKED_EXTERNAL

## Business and brand inputs

- Optional final logo, approved palette/font identity and replacement of the
  current tokenized ARDAŞ wordmark.
- Exact verified contact details and exact addresses.
- Final approved brand list, logo usage rights and product taxonomy/content.
- Final real company photography/media and usage rights. Current generated,
  unbranded images remain explicitly temporary and must not be described as
  documentary Ardaş imagery.

## Legal and privacy inputs

- Lawyer-approved TR/EN Privacy Policy, KVKK/Data Protection text, Cookie Policy,
  candidate notice and contact notice, each with a traceable approval reference
  and a new non-`TEMP` version.
- Approved candidate, contact and audit retention durations.
- Exact legal/data-controller identity, registered details and official
  application/contact channels.
- Approved deletion/anonymization/legal-hold operating policy and responsible
  owner.
- Provider DPA/subprocessor/data-region and any international-transfer approval.

The existing temporary legal version must never be overwritten. Final content
is a new immutable CMS revision/version; historic submissions keep their
original notice provenance. Until approved versions and retention/provider gates
exist, production career/contact submission remains fail-closed. The public
corporate and legal pages remain available.

## Identity, hosting and database provisioning

- Auth0 EU production tenant/application, client credentials, callback/logout /
  allowed-origin configuration, no-registration evidence, MFA Always proof and
  role/claim mapping verification.
- Neon production PostgreSQL 18 project/branch in AWS Frankfurt, pooled and
  direct connection secrets, access controls and operational owner.
- Vercel production project, canonical domain, secure environment variables,
  access ownership and deployment permission.
- Production domain, DNS provider/access, canonical origin and TLS certificate /
  redirect validation.

## AWS, email and monitoring provisioning

- AWS `eu-central-1` public, quarantine, protected and backup S3 buckets;
  encryption, versioning/lifecycle and least-privilege IAM evidence.
- GuardDuty Malware Protection for S3, EventBridge rule, SQS queue/retry/DLQ,
  queue-age/backlog alarms and end-to-end clean/infected/error/timeout evidence.
- SES verified sender/domain, official HR and Contact Manager recipients, outbox
  scheduler, delivery/bounce/failure monitoring, SPF, DKIM and DMARC.
- Sentry Germany project/DSN/release ownership and provider-side PII scrubbing
  proof; CloudWatch dashboards/alarms and on-call destinations.

## Recovery and post-deployment evidence

- Business-approved RPO/RTO and responsible backup/recovery owner.
- Neon production PITR history, encrypted logical-export schedule and restore
  rehearsal evidence.
- Protected/public/quarantine object lifecycle/restore rehearsal and post-restore
  retention reconciliation.
- Staging sign-off, production smoke evidence and rollback of a known-good hosted
  deployment.
- Production field Core Web Vitals p75 for LCP, INP and CLS after deployment.
  Existing `CLS=0`, lab `LCP=136 ms` and `150,554` delivered JS bytes are local
  regression diagnostics, not field p75.

## Information required from the owner

Provide only verified values/evidence for the items above: final identity/media,
legal copy and approval reference, legal/controller/contact/address data,
retention durations, domain/DNS access, provider project/resource identifiers
and credentials through secret management, official email sender/recipients,
provider/legal approvals, backup ownership and go-live sign-off. No value may be
guessed or committed to Git.
