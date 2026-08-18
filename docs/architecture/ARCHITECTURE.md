# Architecture Baseline v0.3

## Selected Technology Baseline

```text
Web framework: Next.js
Language: TypeScript
Package manager: pnpm
Database: PostgreSQL
```

Exact versions are selected at Milestone 0.

## Logical Components

```text
Browser
  ├─ Public Website (/tr, /en)
  └─ Admin (/admin)
        ↓
Next.js Application Server
  ├─ public rendering/content
  ├─ admin/auth/RBAC
  ├─ career/contact submissions
  ├─ media/file access
  ├─ publication/preview
  └─ audit/operations
        ↓
PostgreSQL
Protected/Public Object Storage
Malware Scanner
Email Provider
Monitoring/Logging
```

## Security Boundaries

Public:

- reads published content,
- submits approved forms,
- never accesses protected CV.

Admin:

- MFA,
- authenticated,
- server-authorized,
- Turkish UI.

## Storage Classes

```text
public
protected
quarantine
```

CV flow:

```text
upload
→ quarantine
→ mandatory scan
→ clean protected
```

## Provider Selection

Still TBD during implementation:

- hosting
- PostgreSQL hosting
- object storage
- auth/MFA provider/implementation
- malware scanning integration
- email
- monitoring

Provider selection must satisfy:

- backup/export,
- separate staging/production,
- data-region documentation,
- secret management,
- protected object access,
- operational monitoring.

## References

- `DATA_MODEL.md`
- `ENVIRONMENTS.md`
- `../requirements/I18N.md`
- `../security/SECURITY_BASELINE.md`
