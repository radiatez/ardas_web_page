# Security Incident Response & Secret Rotation

## Trigger Examples

- credential/token leak,
- suspicious admin login,
- unauthorized candidate/contact access,
- malicious upload detection,
- storage exposure,
- database compromise,
- unexpected Dealer Portal URL change,
- compromised email sender/API key.

## Immediate Actions

1. Preserve evidence/logs.
2. Disable/revoke affected account/session.
3. Rotate compromised secret/key/token.
4. Isolate affected integration/storage path.
5. Block malicious IP/account where appropriate.
6. Verify audit trail.
7. Assess exposed data scope.
8. Escalate internally according to company procedure.

## Secret Rotation

Maintain ability to rotate without code rewrite:

- database credentials,
- auth/session secrets,
- storage keys,
- email provider keys,
- monitoring credentials,
- deployment tokens.

Never hard-code these in source/CMS.

## Milestone 8 Secret-Rotation Tabletop — 2026-08-19

No real secret was generated, read or changed. The following runbook contracts
were walked through:

| Scenario | Revoke / contain | Replace | Redeploy / verify | Prove old credential is dead |
|---|---|---|---|---|
| Compromised SES/email key | Disable the affected IAM access key and pause notification worker retries if abuse is active | Create a least-privilege replacement in the approved secret manager; update SES sender configuration only if implicated | Redeploy worker/app, send non-PII delivery probe, resume bounded retries and monitor bounce/reputation | AWS IAM reports old key inactive/deleted; signed call with old key is rejected |
| Compromised S3 storage key | Disable key/session, block affected principal and inspect CloudTrail/S3 access; keep CV downloads fail-closed | Issue least-privilege S3 credentials/role and update secret manager/IAM binding | Redeploy scanner/app workers; verify quarantine cannot list publicly and clean protected read requires permission/MFA | Old principal/key receives access denied; revoke active sessions where supported |
| Compromised Auth0 application/session secret | Rotate client secret and session secret, revoke affected sessions/users and inspect tenant logs | Store new Auth0 client/session secrets in each environment separately | Redeploy, verify callback, MFA-required admin access, logout and revoked/expired-session denial | Old secret cannot exchange callback/session material; prior sessions are invalid |
| Compromised PostgreSQL credential | Revoke/disable role or rotate password, restrict network path and inspect query/audit logs | Create/rotate least-privilege app credential in Neon/secret manager | Redeploy, verify migrations separately from app runtime, DB health and public form fail-safe behavior | Old role/password cannot connect; active old sessions are terminated |

For every scenario, preserve audit/evidence before rotation where containment
allows, change all environment references atomically, avoid secret values in
tickets/logs, validate rollback, and record owner/timestamps. Actual provider
console steps, approvers and alert recipients remain provisioning-time inputs.

## Recovery

- patch root cause,
- deploy through validated pipeline,
- re-enable affected services deliberately,
- monitor for recurrence,
- document incident and remediation.

## Privacy/Legal

Notification obligations and legal timelines are outside this technical document and must follow approved company/legal process.

## Post-Incident

Record:

- timeline,
- impact,
- root cause,
- controls that failed,
- actions taken,
- follow-up owners,
- preventive changes.
