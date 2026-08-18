# Environment Strategy v0.3

## Build Baseline

```text
Next.js
TypeScript
pnpm
PostgreSQL
```

## Environments

Required:

```text
local
staging
production
```

Managed resources are isolated by environment. Staging must have its own Vercel
project/environment, Neon branch or project according to access boundaries,
Auth0 tenant/application, S3 buckets/prefix policy, SES configuration and
Sentry project.

## Local

- developer data only,
- no production candidate/contact data,
- local/dev secrets only,
- safe fake CV fixtures.

## Staging

Purpose:

- integration,
- preview,
- E2E,
- migration validation,
- deployment rehearsal.

Staging must not silently use production databases/storage.

If realistic personal data is needed, use sanitized/synthetic fixtures.

## Production

- production secrets,
- production database,
- protected production storage,
- monitoring,
- backup,
- strict access.

## Configuration Classes

### Public/non-secret

Examples:

```text
SITE_URL
DEFAULT_LOCALE
SUPPORTED_LOCALES
public analytics ID if used
```

### Server configuration

Examples:

```text
DEALER_PORTAL_URL fallback
UPLOAD_MAX_SIZE
RETENTION policy values
```

### Secrets

Examples:

```text
DATABASE_URL
SESSION/AUTH secrets
object storage credentials
email provider credentials
monitoring DSN/token where secret
```

Secrets use environment/secret management, never source control or generic CMS fields.

## Database Migrations

Rules:

- migrations committed to Git,
- tested in staging,
- backward-compatible deployment strategy where practical,
- pre-migration backup for risky changes,
- rollback/forward-fix plan documented.

CI validates migrations against a clean PostgreSQL 18 database. Production uses
Neon in AWS Frankfurt; local/CI use the official PostgreSQL 18.4 image.

## Environment Promotion

Preferred:

```text
feature branch
→ CI
→ staging deploy
→ validation
→ production deploy
```

Production deploy requires the current milestone gates to pass.
