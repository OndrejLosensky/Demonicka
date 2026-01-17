# Prisma Migration Strategy for Beer Pong Feature

## Production Migration Process

### Step 1: Create Migration (Development)
```bash
cd apps/server
npx prisma migrate dev --create-only --name add_beer_pong_tables
```

### Step 2: Review Migration File
Check `prisma/migrations/[timestamp]_add_beer_pong_tables/migration.sql`

**Verify it ONLY contains:**
- ✅ CREATE TYPE (for new enums)
- ✅ CREATE TABLE (for new tables)
- ✅ CREATE INDEX (for new indexes)
- ✅ ALTER TABLE ... ADD CONSTRAINT (for foreign keys)

**Should NOT contain:**
- ❌ DROP TABLE
- ❌ ALTER TABLE ... DROP COLUMN
- ❌ DELETE FROM
- ❌ TRUNCATE

### Step 3: Apply Migration in Production
```bash
# Production deployment
npx prisma migrate deploy
```

This migration is **safe** because it only adds new tables and doesn't modify existing ones.

## What Gets Added

### New Enums
- `BeerPongEventStatus` (DRAFT, ACTIVE, COMPLETED)
- `BeerPongGameStatus` (PENDING, IN_PROGRESS, COMPLETED)
- `BeerPongRound` (QUARTERFINAL, SEMIFINAL, FINAL)
- `CancellationPolicy` (KEEP_BEERS, REMOVE_BEERS)

### New Tables
- `BeerPongEvent` - Tournament instances
- `BeerPongTeam` - Duo teams
- `BeerPongGame` - Individual matchups
- `BeerPongGameBeer` - Tracks beers for undo functionality

### New Relations
- Foreign keys to existing `Event`, `User`, `EventBeer` tables
- These are **read-only** from existing tables - no data is modified

## Existing Data Safety

✅ All existing `Event` records remain untouched
✅ All existing `User` records remain untouched
✅ All existing `EventBeer` records remain untouched
✅ All existing `Beer` records remain untouched
✅ All existing functionality continues to work

## Rollback Strategy

If needed, you can rollback by:
1. Dropping the new tables (they'll be empty anyway)
2. Reverting to previous migration
3. Existing data is never touched, so rollback is safe

```sql
-- Manual rollback (only if needed)
DROP TABLE IF EXISTS "BeerPongGameBeer";
DROP TABLE IF EXISTS "BeerPongGame";
DROP TABLE IF EXISTS "BeerPongTeam";
DROP TABLE IF EXISTS "BeerPongEvent";
DROP TYPE IF EXISTS "CancellationPolicy";
DROP TYPE IF EXISTS "BeerPongRound";
DROP TYPE IF EXISTS "BeerPongGameStatus";
DROP TYPE IF EXISTS "BeerPongEventStatus";
```
