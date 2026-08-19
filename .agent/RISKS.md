# Risk Register v0.3

| ID | Risk | Severity | Likelihood | Mitigation / Gate | Status |
|---|---|---:|---:|---|---|
| R-001 | Career form stores CV before protected storage/RBAC/MFA exists | Critical | Medium | Production submission disabled until Security Milestone passes | Open |
| R-002 | Candidate data retained indefinitely | High | Medium | Configurable retention + deletion/anonymization + launch approval | Mitigated in code; durations TBD |
| R-003 | Malicious CV upload | Critical | Medium | PDF-only, 10 MB, signature/MIME validation, mandatory malware scan, fail-closed quarantine | Mitigated in code; AWS provisioning pending |
| R-004 | Admin permissions too broad | Critical | Medium | Explicit RBAC matrix + negative tests | Mitigated |
| R-005 | TR/EN added too late | High | Low | i18n in architecture milestone | Mitigated |
| R-006 | Dealer Portal redirected to malicious host | High | Low | HTTPS validation + allowlist option + Super Admin + audit | Mitigated |
| R-007 | PII leaks into logs | High | Medium | Structured redaction + tests | Mitigated in application; provider scrubbing pending |
| R-008 | Content change overwrites approved version | Medium | Medium | revision/preview/rollback/audit | Open |
| R-009 | Migration breaks production | High | Low | staging validation + backup + rollback/forward-fix | Open |
| R-010 | Backups cannot restore | High | Medium | restore testing | Open |
| R-011 | Heavy hero media hurts mobile CWV | Medium | Medium | budgets + responsive media + monitoring | Open |
| R-012 | Brand identity arrives late | Medium | Medium | tokenized design | Mitigated |
| R-013 | Privacy/retention approval unresolved at launch | High | Medium | production launch gate | Open |
| R-014 | Form spam | Medium | Medium | rate limit + honeypot + challenge if needed | Partially mitigated; later form validation pending |
| R-015 | Wrong locale fallback creates mixed-language page | Medium | Low | deterministic 404/switch policy | Mitigated |
| R-016 | Contact messages visible to unrelated staff | High | Low | Contact Manager role + explicit permissions | Mitigated |
| R-017 | Malware scanner outage creates unsafe file access | Critical | Medium | fail-closed quarantine; no download until clean | Mitigated in code; provider validation pending |
| R-018 | Slug change creates broken indexed links | Medium | Medium | slug history + 301 redirects | Mitigated by design |
| R-019 | Audit log tampering hides privileged activity | High | Low | append-only design, restricted access, external integrity/backup controls | Partially mitigated; external export pending |
| R-020 | Email/domain misconfiguration causes notification delivery failures | Medium | Medium | SPF/DKIM/DMARC + verified sender + monitoring/retry | Open |
| R-021 | Developer/CI toolchain drift creates non-reproducible builds | Medium | Medium | Exact package versions, `.node-version`, `packageManager`, frozen lockfile, pinned CI | Mitigated by design |
| R-022 | Dependency lifecycle scripts execute unexpectedly during install | High | Low | pnpm build-script allowlist; frozen lockfile; supply-chain age verification | Mitigated by design |
| R-023 | Provider contract/DPA/data-transfer review is incomplete at launch | High | Medium | Provisioning does not equal legal approval; DPA/subprocessor/region review remains a launch gate | Open |
| R-024 | Cross-provider event failure leaves clean or unsafe CVs stuck/misclassified | Critical | Medium | Fail-closed quarantine, idempotent GuardDuty event handling, retries, queue-age/backlog alarms | Mitigated in code; queue/alarm provisioning pending |
| R-025 | Auth0 tenant policy permits an admin login without MFA | Critical | Low | EU environment isolation, MFA `Always`, no public registration, production negative/bypass tests | Mitigated in code; tenant validation pending |
| R-026 | Managed database restore history is insufficient or provider-coupled | High | Low | Neon PITR plus encrypted logical exports and periodic `pg_restore` rehearsal | Open |
| R-027 | Monitoring or email payloads duplicate candidate/contact PII | High | Medium | Record-ID-only notifications where practical, strict Sentry scrubbing, no bodies/CV data in telemetry | Mitigated in logging; Sentry/SES validation pending |
| R-028 | Static CSP needs inline script/style compatibility for the current Next.js runtime | High | Low | Restrictive default/object/frame/connect policy now; migrate to nonce/hash CSP when dynamic admin rendering is introduced | Open |
| R-029 | CMS emits an unsupported or malformed public content block | Medium | Medium | Versioned allowlist parser safely drops unknown fields; Milestone 6 must add authoring validation and preview regression tests | Partially mitigated; CMS validation pending |
