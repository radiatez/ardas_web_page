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
