---
name: senior-frontend
description: Build the Ardaş Next.js + TypeScript + pnpm frontend/admin with PostgreSQL-backed models, locale-aware publishing, accessibility, performance and secure server boundaries.
---

# Senior Frontend — Ardaş v0.3

## Technology Baseline

```text
Next.js
TypeScript
pnpm
PostgreSQL
```

Exact versions are selected in Milestone 0.

## Required References

- `../../../docs/architecture/ARCHITECTURE.md`
- `../../../docs/architecture/DATA_MODEL.md`
- `../../../docs/requirements/I18N.md`
- `../../../docs/security/SECURITY_BASELINE.md`
- `../../../docs/testing/TEST_MATRIX.md`

## Core Rules

- strict TypeScript,
- server-first where appropriate,
- minimal client JS,
- server-side permission checks,
- locale-aware content status,
- accessible semantic HTML,
- WCAG 2.2 AA,
- optimized media.

## Admin

Production admin requires MFA.

## Forms

Career/contact store privacy provenance.

Career CV:

```text
PDF only
10 MB
mandatory malware scan
fail closed
```

## Routing

Use stable internal route keys and localized paths.

## Performance

Target p75:

- LCP ≤ 2.5s
- INP ≤ 200ms
- CLS ≤ 0.10

## Completion

Run actual project:

- lint
- typecheck
- test
- build
- relevant E2E
