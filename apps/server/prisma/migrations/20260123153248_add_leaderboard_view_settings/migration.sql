-- CreateEnum (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE "LeaderboardViewMode" AS ENUM ('LEADERBOARD', 'BEER_PONG', 'AUTO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop table if it exists (from failed migration)
DROP TABLE IF EXISTS "LeaderboardViewSettings";

-- CreateTable
CREATE TABLE "LeaderboardViewSettings" (
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
CREATE INDEX "LeaderboardViewSettings_updatedBy_idx" ON "LeaderboardViewSettings"("updatedBy");

-- CreateIndex
CREATE INDEX "LeaderboardViewSettings_selectedBeerPongEventId_idx" ON "LeaderboardViewSettings"("selectedBeerPongEventId");

-- Insert default settings row
INSERT INTO "LeaderboardViewSettings" (id, "autoSwitchEnabled", "currentView", "switchIntervalSeconds", "createdAt", "updatedAt") VALUES
('f0000000-0000-0000-0000-000000000013', false, 'LEADERBOARD', 15, NOW(), NOW());
