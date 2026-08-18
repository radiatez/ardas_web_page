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

## Production Gates

Block deploy for:

- failing critical tests,
- unresolved Critical security risk,
- unresolved privacy/retention gate when forms enabled,
- MFA disabled,
- malware scan unavailable for career flow,
- staging validation failure.

## Secrets

Outside Git and generic CMS settings.

## Audit

Record commit/version, environment, time, migration IDs and deploy result.
