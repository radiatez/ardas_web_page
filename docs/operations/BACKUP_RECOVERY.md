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

## Selected Storage and Region

- Neon PostgreSQL 18, AWS Frankfurt (`eu-central-1`): provider restore history /
  PITR according to the approved production plan.
- Encrypted standard PostgreSQL logical exports: dedicated Amazon S3 backup
  bucket in `eu-central-1`.
- Public, protected and quarantine object buckets: Amazon S3 `eu-central-1`,
  with versioning/lifecycle configured according to the approved retention
  policy.

Exact backup frequency, restore window, object version retention and cross-region
disaster-recovery policy remain `TBD` until business RPO/RTO and legal data-region
requirements are approved. No cross-region replication is enabled implicitly.

## Restore Tests

A backup is not considered reliable until restored successfully.

Required:

- periodic staging/sandbox restore test,
- verify database integrity,
- verify protected file relationships,
- reapply retention/deletion policies after restore.

Also verify that a standard `pg_dump` export can be restored with `pg_restore`
without Neon-specific tooling. Provider PITR alone is not the portability test.

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
