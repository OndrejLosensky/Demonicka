# Backup Configuration Guide

## Overview

The backup service creates compressed PostgreSQL dumps and uploads them to **S3** (same bucket as gallery and profile pictures), under the prefix `demonicka/backups/YYYY-MM/` (e.g. `demonicka/backups/2026-03/demonicka_database_2026-03-04T12-00-00.sql.gz`).

- **Manual backup:** Triggered from the System → Users page (or API `POST /api/backup/run`). Returns a job ID; status and completion are available via the Jobs page and WebSocket.
- **Scheduled backup:** Optional hourly cron when `BACKUP_ENABLED=true`.

## Environment Variables

### S3 (required for backup upload)

Backups use the same S3 configuration as gallery and profile pictures:

```bash
AWS_REGION=eu-central-1
AWS_S3_BUCKET=your-bucket
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### Optional

```bash
# Enable hourly backup (default: off)
BACKUP_ENABLED=true

# Local directory for temporary backup before upload (default: apps/server/data/backups/database or /var/backups/demonicka in production)
BACKUP_DIR=/path/to/writable/dir

# Delete local backup files older than N days (only affects files left in BACKUP_DIR; default: 0 = no cleanup)
BACKUP_RETENTION_DAYS=7

# Force a specific pg_dump binary (e.g. if server runs in an environment where auto-detection fails)
BACKUP_PG_DUMP_PATH=/opt/homebrew/opt/postgresql@17/bin/pg_dump
```

## Backup flow

1. A backup job is enqueued (manual or cron).
2. The worker runs `pg_dump` (PostgreSQL 17 recommended; version is checked).
3. Output is gzipped to a local file, then uploaded to S3 at `demonicka/backups/{year}-{month}/{filename}.sql.gz`.
4. The local file is removed after a successful upload.

## Manual trigger

From the app: System → Users → “Spustit zálohu”. The request returns immediately with a job ID; use System → Úlohy to see status and any error.

Via API:

```http
POST /api/backup/run
Authorization: Bearer <token>
```

Response: `{ "jobId": "<uuid>", "status": "queued" }`. Poll `GET /api/jobs/:jobId` or listen for `job:updated` over WebSocket.

## Troubleshooting

- **pg_dump version mismatch:** Server must use `pg_dump` 17.x for a PostgreSQL 17 server. The app tries common Homebrew paths first; if your process doesn’t see them, set `BACKUP_PG_DUMP_PATH` to the correct binary.
- **S3 errors:** Ensure `AWS_*` env vars are set and the bucket allows PutObject for the backup key prefix.
- **Job failed:** Check System → Úlohy for the error message and stack trace.

## Security

- Do not commit AWS credentials or `.env` files.
- Backups in S3 are private; use IAM and bucket policy to restrict access.
