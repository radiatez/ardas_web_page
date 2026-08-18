# Risk Register v0.3

| ID | Risk | Severity | Likelihood | Mitigation / Gate | Status |
|---|---|---:|---:|---|---|
| R-001 | Career form stores CV before protected storage/RBAC/MFA exists | Critical | Medium | Production submission disabled until Security Milestone passes | Open |
| R-002 | Candidate data retained indefinitely | High | Medium | Configurable retention + deletion/anonymization + launch approval | Open |
| R-003 | Malicious CV upload | Critical | Medium | PDF-only, 10 MB, signature/MIME validation, mandatory malware scan, fail-closed quarantine | Open |
| R-004 | Admin permissions too broad | Critical | Medium | Explicit RBAC matrix + negative tests | Open |
| R-005 | TR/EN added too late | High | Low | i18n in architecture milestone | Mitigated |
| R-006 | Dealer Portal redirected to malicious host | High | Low | HTTPS validation + allowlist option + Super Admin + audit | Open |
| R-007 | PII leaks into logs | High | Medium | Structured redaction + tests | Open |
| R-008 | Content change overwrites approved version | Medium | Medium | revision/preview/rollback/audit | Open |
| R-009 | Migration breaks production | High | Low | staging validation + backup + rollback/forward-fix | Open |
| R-010 | Backups cannot restore | High | Medium | restore testing | Open |
| R-011 | Heavy hero media hurts mobile CWV | Medium | Medium | budgets + responsive media + monitoring | Open |
| R-012 | Brand identity arrives late | Medium | Medium | tokenized design | Mitigated |
| R-013 | Privacy/retention approval unresolved at launch | High | Medium | production launch gate | Open |
| R-014 | Form spam | Medium | Medium | rate limit + honeypot + challenge if needed | Open |
| R-015 | Wrong locale fallback creates mixed-language page | Medium | Low | deterministic 404/switch policy | Mitigated |
| R-016 | Contact messages visible to unrelated staff | High | Low | Contact Manager role + explicit permissions | Mitigated |
| R-017 | Malware scanner outage creates unsafe file access | Critical | Medium | fail-closed quarantine; no download until clean | Mitigated by design |
| R-018 | Slug change creates broken indexed links | Medium | Medium | slug history + 301 redirects | Mitigated by design |
| R-019 | Audit log tampering hides privileged activity | High | Low | append-only design, restricted access, external integrity/backup controls | Open |
| R-020 | Email/domain misconfiguration causes notification delivery failures | Medium | Medium | SPF/DKIM/DMARC + verified sender + monitoring/retry | Open |
| R-021 | Developer/CI toolchain drift creates non-reproducible builds | Medium | Medium | Exact package versions, `.node-version`, `packageManager`, frozen lockfile, pinned CI | Mitigated by design |
| R-022 | Dependency lifecycle scripts execute unexpectedly during install | High | Low | pnpm build-script allowlist; frozen lockfile; supply-chain age verification | Mitigated by design |
