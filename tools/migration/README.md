# Data Migration Tools

Tools for migrating data from SQLite to PostgreSQL.

## Prerequisites

1. SQLite database exists at `apps/server/data/database.sqlite`
2. PostgreSQL database is set up and `DATABASE_URL` is configured in `apps/server/.env`
3. Prisma migration has been run to create the schema in PostgreSQL

## Setup

Install dependencies:

```bash
cd tools/migration
pnpm install
```

## Usage

### Step 1: Create PostgreSQL Schema

First, make sure the PostgreSQL schema exists by running the Prisma migration:

```bash
cd ../../apps/server
pnpm prisma migrate deploy
# or for development:
pnpm prisma migrate dev
```

### Step 2: Export SQLite Data

Export all data from SQLite to JSON files:

```bash
cd tools/migration
pnpm export:sqlite
```

This creates `exported-data/` directory with JSON files for each table.

### Step 3: Import to PostgreSQL

Import the exported data into PostgreSQL:

```bash
pnpm import:postgres
```

**Note:** Make sure `DATABASE_URL` is set in your environment or in `apps/server/.env`

### Complete Migration

Run both steps automatically:

```bash
pnpm migrate:data
```

## Table Name Mapping

The scripts handle mapping between SQLite table names and PostgreSQL table names:

| SQLite Table | PostgreSQL Table |
|--------------|------------------|
| users | User |
| refresh_tokens | RefreshToken |
| device_token | DeviceToken |
| beers | Beer |
| barrels | Barrel |
| events | Event |
| event_beers | EventBeer |
| event_users | EventUsers |
| event_barrels | EventBarrels |
| achievements | Achievement |
| user_achievements | UserAchievement |

## Data Type Conversions

The import script handles:
- Boolean conversion (SQLite 0/1 → PostgreSQL true/false)
- Date/time conversion (SQLite datetime strings → PostgreSQL timestamptz)
- Array conversion (SQLite simple-array comma-separated → PostgreSQL arrays)
- UUID conversion (if needed)

## Troubleshooting

### DATABASE_URL not found
Make sure the environment variable is set. You can either:
- Set it in `apps/server/.env`
- Export it in your shell: `export DATABASE_URL="postgresql://..."`

### Table not found errors
Make sure you've run the Prisma migration first to create the schema in PostgreSQL.

### Foreign key constraint errors
The import script imports tables in dependency order. If you still get FK errors, check that:
1. Parent tables (users, barrels, events, achievements) are imported first
2. All referenced records exist in parent tables

### Duplicate key errors
The import script uses `ON CONFLICT DO NOTHING` to skip duplicates. If you want to replace data, you may need to truncate tables first.

## Files

- `export-sqlite.ts` - Exports data from SQLite database
- `import-postgres.ts` - Imports data to PostgreSQL database
- `migrate-data.ts` - Runs complete migration process
- `exported-data/` - Directory containing exported JSON files (created by export script)
