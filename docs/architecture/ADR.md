# Architecture Decision Record Index

Formal project choices are mirrored in `.agent/DECISIONS.md`.

Use this file for implementation-level ADRs that emerge during coding.

## ADR Template

```md
## ADR-XXX — Title

Date:
Status: Proposed | Accepted | Superseded

### Context

### Decision

### Alternatives Considered

### Consequences

### Validation
```

## Seed ADRs

### ADR-001 — Locale Architecture

Status: Accepted

Use locale-prefixed public routes and localized slugs backed by stable internal route keys.

See:

- `.agent/DECISIONS.md`
- `../requirements/I18N.md`

### ADR-002 — Protected Candidate Files

Status: Accepted

CVs use protected object/file storage and authenticated authorized download, never public static URLs.

### ADR-003 — Permission-Based RBAC

Status: Accepted

Roles aggregate explicit permissions. Server actions/API handlers verify permissions directly.

### ADR-004 — Bilingual CMS From Initial Schema

Status: Accepted

Localized data is modeled before public pages are implemented.

### ADR-005 — Exact Milestone 0 Toolchain

Date: 2026-08-18
Status: Accepted

#### Context

The v0.3 baseline requires exact versions before scaffold and a reproducible
Node.js/pnpm toolchain.

#### Decision

Use:

```text
Node.js 24.19.0 LTS
pnpm 11.22.0
Next.js 16.3.1
React 19.2.8
TypeScript 6.0.3
ESLint 9.39.5
Vitest 4.1.10
```

#### Consequences

- `.node-version`, `packageManager`, engine ranges and CI pin the toolchain.
- application dependencies use exact versions and `pnpm-lock.yaml` is committed.
- upgrades are deliberate reviewed changes.

#### Validation

Run `pnpm install --frozen-lockfile` and `pnpm run check` on the pinned CI runtime.

### ADR-006 — Drizzle ORM and Drizzle Kit

Date: 2026-08-18
Status: Accepted

#### Context

The application needs PostgreSQL-backed, type-safe models and committed,
reviewable migrations for localized publishing and privacy-sensitive records.

#### Decision

Use Drizzle ORM 0.45.2, Drizzle Kit 0.31.10 and the `pg` driver. Generate and
commit reviewable PostgreSQL migrations with Drizzle Kit.

#### Alternatives Considered

- Prisma ORM 7.9.1 and Prisma Migrate.
- direct `pg` queries with hand-authored migrations.

Prisma was not selected because its optional CLI peer was resolved into the
production graph and exposed an unresolved high-severity transitive advisory at
the time of selection. Forcing a transitive major override was rejected.

#### Consequences

- schema and migrations are implemented in Milestone 1,
- migration SQL is committed and reviewed,
- database access remains server-only,
- custom SQL remains available when the typed query layer is insufficient.

#### Validation

Milestone 1 must prove clean migration, generation and database reset against a
non-production PostgreSQL instance.
