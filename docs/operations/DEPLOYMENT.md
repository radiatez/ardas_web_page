# Deployment & CI/CD v0.3

## Selected baseline

```text
Next.js / TypeScript / pnpm
Vercel fra1
Neon PostgreSQL 18, AWS Frankfurt
```

Vercel uses the Node version in `.node-version`, pnpm from `packageManager`, the
frozen install command and `pnpm run build` declared in `vercel.json`. GitHub
Actions is the authoritative remote quality pipeline.

## Promotion pipeline

```text
feature/main change
→ pnpm install --frozen-lockfile
→ lint + typecheck + Vitest + build + dependency audit
→ clean PostgreSQL migration/seed/reproducibility
→ Playwright browser/axe/responsive regression
→ recovery + rollback contract
→ staging deploy and smoke
→ production promotion
```

Staging and production use isolated Vercel projects/environments, Neon branches
or projects, Auth0 applications/tenants, AWS resources, SES and monitoring.

## Migration and seed

`DATABASE_URL` is the Neon pooled runtime connection.
`MIGRATION_DATABASE_URL` is the direct/non-pooled connection for controlled
release jobs. Never run migrations automatically inside a Vercel build.

```powershell
$env:MIGRATION_DATABASE_URL = "<NEON-DIRECT-URL>"
corepack pnpm run db:migrate
corepack pnpm run db:seed:production
```

Release order:

```text
CI green
→ confirm backup/recovery point
→ migration with direct URL
→ idempotent production seed
→ Vercel deploy/promote
→ smoke checks
```

The seed creates only missing structural public content, verified stats and
temporary legal/form-notice revisions. It preserves existing CMS rows/settings
and never creates fake operational or personal data.

## Smoke strategy

After staging and production promotion, validate with synthetic data only:

- `/` redirects to `/tr`; all required TR/EN corporate/legal routes render,
- canonical, hreflang, sitemap, robots and historical-slug 301 are correct,
- responsive media loads with no horizontal overflow,
- Dealer Portal resolves through validated setting/environment fallback only,
- incomplete Auth0 returns admin unavailable rather than a bypass,
- disabled/incomplete career/contact providers show localized unavailable state
  and accept no data,
- once externally approved/enabled: admin MFA/RBAC, submission/outbox, GuardDuty
  clean/infected/error/timeout and alert paths pass.

## Production gates

Block the affected deployment/capability for failing CI, unresolved critical
security risk, absent MFA evidence, unavailable CV scanning, missing approved
privacy/retention inputs, unverified provider/DPA/region status, failed staging
smoke or missing recovery point. Temporary legal content cannot enable forms.

The precise implementation/external split is maintained in
`PRODUCTION_READINESS.md`.

## Secrets

Use Vercel/provider secret management and environment isolation. Never place
database, Auth0, AWS, SES, Sentry release, cron or rate-limit secrets in Git,
generic Site Settings or `NEXT_PUBLIC_*` variables.

## Deployment record

Record commit/version, GitHub Actions run, environment, Vercel deployment ID,
migration IDs/job result, production-seed result, recovery point, time, operator
and smoke outcome. Rollback follows `ROLLBACK.md` and must identify a known-good
deployment.
