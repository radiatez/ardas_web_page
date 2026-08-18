# Rollback Strategy

## Application Rollback

Production deployment must identify a known previous good version.

If release is reversible without schema conflict:

```text
stop/redirect rollout
→ redeploy previous good build
→ validate health
```

## Database Changes

Prefer backward-compatible migrations.

For risky migrations:

- backup,
- staged test,
- forward-fix/rollback plan.

Never assume dropping columns/data can be trivially rolled back.

## Content Rollback

CMS content uses revision history.

Rollback:

- restores selected previous revision as a new current revision,
- preserves history,
- records actor/time.

## Configuration Rollback

High-risk site-setting changes, including Dealer Portal URL, are audited.

Super Admin must be able to restore prior valid value.

## Incident Validation

After rollback verify:

- public routes,
- admin auth,
- DB health,
- career/contact persistence,
- protected CV access,
- locale routes.
