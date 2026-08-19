# Deployment & CI/CD v0.3

## Selected Build Baseline

```text
Next.js
TypeScript
pnpm
PostgreSQL
```

## Pipeline

```text
Pull Request
→ pnpm install --frozen-lockfile
→ lint
→ typecheck
→ tests
→ build
→ security/dependency checks
→ staging deploy
→ smoke/E2E
→ production deploy
```

Actual script names follow scaffolded `package.json`.

## Migration

- versioned in Git,
- staging first,
- backup before risky production migration,
- compatibility/rollback plan.

After migrations, run `pnpm db:seed:legal` (or `pnpm db:setup`). The idempotent
seed creates missing TR/EN temporary legal and form-notice records with their
initial immutable revisions; it does not overwrite existing CMS locale rows.

## Production Gates

Block deploy for:

- failing critical tests,
- unresolved Critical security risk,
- unresolved privacy/retention gate when forms enabled,
- MFA disabled,
- malware scan unavailable for career flow,
- staging validation failure.
- temporary/review-required career or contact privacy notice while that public
  form is enabled in production,
- missing lawyer-approved legal copy/controller identity/application channels.

## Secrets

Outside Git and generic CMS settings.

## Audit

Record commit/version, environment, time, migration IDs and deploy result.
