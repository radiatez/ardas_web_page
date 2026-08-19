# Risk Register v0.3

| ID | Risk | Severity | Likelihood | Mitigation / Gate | Status |
|---|---|---:|---:|---|---|
| R-001 | Career form stores CV before protected storage/RBAC/MFA exists | Critical | Medium | Production form gate requires Auth0, retention, privacy, rate-limit, S3, GuardDuty and notification configuration; upload remains quarantined until clean | Mitigated in code; provider provisioning pending |
| R-002 | Candidate data retained indefinitely | High | Medium | Configurable deadline/hold + due-only HR anonymization + Super Admin override boundary + CV cleanup + launch approval | Mitigated in code/tested on PostgreSQL; durations TBD |
| R-003 | Malicious CV upload | Critical | Medium | PDF-only, 10 MB, signature/MIME validation, mandatory malware scan, fail-closed quarantine | Mitigated in code; AWS provisioning pending |
| R-004 | Admin permissions too broad | Critical | Medium | Explicit permission/scope RBAC + server service checks + named cross-domain HR/candidate negative tests | Mitigated |
| R-005 | TR/EN added too late | High | Low | i18n in architecture milestone | Mitigated |
| R-006 | Dealer Portal redirected to malicious host | High | Low | HTTPS validation + allowlist option + Super Admin + audit | Mitigated |
| R-007 | PII leaks into logs | High | Medium | Structured redaction + tests | Mitigated in application; provider scrubbing pending |
| R-008 | Content change overwrites approved version | Medium | Medium | Separate working copy + immutable revisions + protected preview + rollback-as-new-draft + audit | Mitigated in code |
| R-009 | Migration breaks production | High | Low | staging validation + backup + rollback/forward-fix | Open |
| R-010 | Backups cannot restore | High | Medium | Portable `pg_dump`/`pg_restore` drill verifies migration journal, fixture integrity and post-restore retention cleanup; production schedule/provider restore remains required | Partially mitigated; production rehearsal pending |
| R-011 | Heavy hero media hurts mobile CWV | Medium | Medium | Next Image responsive delivery + focal crops; final media budgets/CWV monitoring remain required | Partially mitigated; final media pending |
| R-012 | Brand identity arrives late | Medium | Medium | tokenized design | Mitigated |
| R-013 | Privacy/retention approval unresolved at launch | High | Medium | production launch gate | Open |
| R-014 | Form spam | Medium | Medium | PostgreSQL-backed privacy-preserving rate limit, same-origin enforcement, strict body limits and honeypot; add challenge only if observed abuse requires it | Mitigated in code; production monitoring pending |
| R-015 | Wrong locale fallback creates mixed-language page | Medium | Low | deterministic 404/switch policy | Mitigated |
| R-016 | Contact messages visible to unrelated staff | High | Low | Contact Manager role + explicit permissions | Mitigated |
| R-017 | Malware scanner outage creates unsafe file access | Critical | Medium | fail-closed quarantine; no download until clean | Mitigated in code; provider validation pending |
| R-018 | Slug change creates broken indexed links | Medium | Medium | slug history + 301 redirects | Mitigated by design |
| R-019 | Audit log tampering hides privileged activity | High | Low | append-only design, restricted access, external integrity/backup controls | Partially mitigated; external export pending |
| R-020 | Email/domain misconfiguration causes notification delivery failures | Medium | Medium | Submission and outbox commit atomically before SES; failed delivery retains the record and retries with safe error codes; SPF/DKIM/DMARC and verified sender remain launch gates | Mitigated in code; SES/domain provisioning pending |
| R-021 | Developer/CI toolchain drift creates non-reproducible builds | Medium | Medium | Exact package versions, `.node-version`, `packageManager`, frozen lockfile, pinned CI | Mitigated by design |
| R-022 | Dependency lifecycle scripts execute unexpectedly during install | High | Low | pnpm build-script allowlist; frozen lockfile; supply-chain age verification | Mitigated by design |
| R-023 | Provider contract/DPA/data-transfer review is incomplete at launch | High | Medium | Provisioning does not equal legal approval; DPA/subprocessor/region review remains a launch gate | Open |
| R-024 | Cross-provider event failure leaves clean or unsafe CVs stuck/misclassified | Critical | Medium | Fail-closed quarantine, idempotent GuardDuty event handling, retries, queue-age/backlog alarms | Mitigated in code; queue/alarm provisioning pending |
| R-025 | Auth0 tenant policy permits an admin login without MFA | Critical | Low | EU environment isolation, MFA `Always`, no public registration, production negative/bypass tests | Mitigated in code; tenant validation pending |
| R-026 | Managed database restore history is insufficient or provider-coupled | High | Low | Neon PITR plus encrypted logical exports; PostgreSQL 18.4 portability restore is now locally rehearsed | Partially mitigated locally; production schedule/PITR pending |
| R-027 | Monitoring or email payloads duplicate candidate/contact PII | High | Medium | Record-ID-only SES notifications and operational events, expanded credential/free-text redaction, strict Sentry scrubbing | Mitigated in application; Sentry/SES validation pending |
| R-028 | Static CSP needs inline script/style compatibility for the current Next.js runtime | High | Low | Per-request crypto nonce forwarded into Next/Auth0, strict-dynamic scripts, nonce styles plus one exact Next Image attribute hash, bounded media origin and three-engine browser regression | Mitigated |
| R-029 | CMS emits an unsupported or malformed public content block | Medium | Medium | Versioned allowlist parser + server authoring validation + protected real-component preview + regression tests | Mitigated in code |
| R-030 | Generated demo imagery is mistaken for approved/licensed production photography | Medium | Low | Local/test-only manifest, no production fallback, explicit README/decision record and mandatory replacement gate | Mitigated in code; final approved photography TBD |
| R-031 | Scheduled content is not applied or fails silently | High | Medium | Idempotent internal worker, PostgreSQL advisory transaction lock, PII-safe failure event; production scheduler and alert provisioning required | Mitigated in code; production invocation/alerting pending |
| R-032 | Candidate privacy action partially completes across S3 and PostgreSQL | High | Low | Delete protected/quarantine object first, then transactional DB anonymize/delete + append-only audit; fail closed and alert/retry on provider/DB error | Mitigated toward inaccessible state; production alert/reconciliation pending |
