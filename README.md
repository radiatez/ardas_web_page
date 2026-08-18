# Ardaş Yedek Parça — Web Application v0.3

This repository contains the Ardaş Yedek Parça corporate website application
and its implementation source-of-truth documents.

## Repository Root

The current intended application repository is:

```text
ardas_web_page
```

Copy the **contents** of this package into the actual repository root.

Expected root:

```text
ardas_web_page/
├── AGENTS.md
├── README.md
├── CHANGELOG.md
├── .agent/
├── .agents/
├── docs/
├── package.json        # created during Milestone 0
├── pnpm-lock.yaml      # created during Milestone 0
├── src/ or app/        # created during Milestone 0
├── public/             # created during Milestone 0
└── ...
```

## Technology Baseline

Selected before scaffold:

```text
Framework: Next.js
Language: TypeScript
Package manager: pnpm
Database engine: PostgreSQL
```

Milestone 0 versions selected on 2026-08-18:

```text
Node.js: 24.19.0 LTS
pnpm: 11.22.0
Next.js: 16.3.1
React / React DOM: 19.2.8
TypeScript: 6.0.3
ESLint: 9.39.5
Vitest: 4.1.10
Drizzle ORM: 0.45.2
Drizzle Kit: 0.31.10
```

Use Corepack so the `packageManager` field selects the repository pnpm version.

```text
corepack pnpm install --frozen-lockfile
corepack pnpm run dev
corepack pnpm run check
```

The root path redirects to `/tr`; the first scaffold contains `/tr` and `/en`.
The temporary Milestone 0 surface is `noindex` and is not approved final content.

Milestone 1 provider architecture:

```text
Hosting: Vercel fra1
PostgreSQL 18: Neon / AWS eu-central-1
Object storage: Amazon S3 eu-central-1
Authentication/MFA: Auth0 EU / MFA Always
Malware scanning: GuardDuty Malware Protection for S3
Transactional email: Amazon SES eu-central-1
Monitoring: Sentry Germany + AWS CloudWatch/EventBridge
```

Provider provisioning, commercial/legal review and production credentials remain
launch-gated. See `docs/architecture/ADR.md`.

## Database Development

The schema is `src/db/schema.ts`; generated SQL is committed under `drizzle/`.
With a developer-owned `.env` and a local PostgreSQL 18 instance:

```text
corepack pnpm run db:generate
corepack pnpm run db:check
corepack pnpm run db:migrate
```

`compose.yaml` provides the selected local database shape where Docker is
available. CI always applies the migration to a clean PostgreSQL 18 database.

## Agent Reading Order

For substantial work:

1. `AGENTS.md`
2. `docs/PROJECT_BRIEF.md`
3. `.agent/DECISIONS.md`
4. `.agent/RISKS.md`
5. `.agent/plans/WEBSITE_IMPLEMENTATION.md`
6. relevant skill/requirement/security documents

## Important Launch Gates

Do not enable production career submissions before:

- admin MFA is working,
- server-side RBAC is tested,
- protected CV storage exists,
- PDF-only CV validation exists,
- malware scanning is active,
- scanner failure is fail-closed,
- retention/deletion workflow exists,
- privacy notice versioning exists,
- production privacy/retention values are approved.

## v0.3 Documentation Additions

```text
docs/
├── architecture/
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── ADR.md
│   └── ENVIRONMENTS.md
├── content/
│   └── CONTENT_INVENTORY.md
├── legal/
│   └── PUBLIC_LEGAL_PAGES.md
├── operations/
│   ├── DEPLOYMENT.md
│   ├── BACKUP_RECOVERY.md
│   ├── LOGGING_MONITORING.md
│   ├── ROLLBACK.md
│   └── DOMAIN_DNS_EMAIL.md
└── security/
    ├── SECURITY_BASELINE.md
    ├── RBAC_MATRIX.md
    ├── FILE_UPLOAD_SECURITY.md
    ├── PRIVACY_RETENTION.md
    ├── AUDIT_POLICY.md
    └── INCIDENT_RESPONSE.md
```

## Current Status

Milestone 0 is complete, pushed to `origin/main`, and remotely validated by
GitHub Actions. Milestone 1 implements provider decisions, PostgreSQL/Drizzle
migrations, localized route identity/publication, privacy provenance, storage
states, audit foundation and data-model tests. Public design starts only in a
later milestone.
