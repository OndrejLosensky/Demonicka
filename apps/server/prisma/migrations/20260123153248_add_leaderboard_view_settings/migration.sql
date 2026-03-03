-- CreateEnum (only if it doesn't exist - 000_baseline may have already created it)
DO $$ BEGIN
    CREATE TYPE "LeaderboardViewMode" AS ENUM ('LEADERBOARD', 'BEER_PONG', 'AUTO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop table if it exists (from failed migration) - only when 000_baseline not applied (table may not exist)
-- CreateTable (idempotent for 000_baseline)
CREATE TABLE IF NOT EXISTS "LeaderboardViewSettings" (
    "id" UUID NOT NULL,
    "autoSwitchEnabled" BOOLEAN NOT NULL DEFAULT false,
    "currentView" "LeaderboardViewMode" NOT NULL DEFAULT 'LEADERBOARD',
    "switchIntervalSeconds" INTEGER NOT NULL DEFAULT 15,
    "selectedBeerPongEventId" UUID,
    "updatedBy" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "LeaderboardViewSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LeaderboardViewSettings_updatedBy_idx" ON "LeaderboardViewSettings"("updatedBy");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LeaderboardViewSettings_selectedBeerPongEventId_idx" ON "LeaderboardViewSettings"("selectedBeerPongEventId");

-- Insert default settings row (only when table is empty)
INSERT INTO "LeaderboardViewSettings" (id, "autoSwitchEnabled", "currentView", "switchIntervalSeconds", "createdAt", "updatedAt")
SELECT 'f0000000-0000-0000-0000-000000000013'::UUID, false, 'LEADERBOARD'::"LeaderboardViewMode", 15, NOW(), NOW()
WHERE (SELECT COUNT(*) FROM "LeaderboardViewSettings") = 0;
