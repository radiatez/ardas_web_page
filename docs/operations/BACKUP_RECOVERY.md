# Backup & Recovery

## Scope

Back up:

- production database,
- protected candidate storage,
- public media where not reproducible,
- critical configuration not stored in Git/secret manager.

## RPO / RTO

Exact business targets are TBD before production.

They must be written here before launch.

## Restore Tests

A backup is not considered reliable until restored successfully.

Required:

- periodic staging/sandbox restore test,
- verify database integrity,
- verify protected file relationships,
- reapply retention/deletion policies after restore.

## Candidate Data

Expired/deleted candidate records must not become active permanently after backup restoration.

Run cleanup/reconciliation after restore.

## Documentation

Record:

- backup frequency,
- retention,
- encryption,
- storage region,
- restore steps,
- last successful restore test.
