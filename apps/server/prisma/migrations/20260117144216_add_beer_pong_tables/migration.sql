/*
  Warnings: (migration made idempotent for 000_baseline)
*/
-- CreateEnum (idempotent)
DO $$ BEGIN CREATE TYPE "BeerPongEventStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "BeerPongGameStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "BeerPongRound" AS ENUM ('QUARTERFINAL', 'SEMIFINAL', 'FINAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "CancellationPolicy" AS ENUM ('KEEP_BEERS', 'REMOVE_BEERS'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AlterTable (only when Achievement.id is still UUID - skip when 000_baseline already applied)
DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Achievement' AND column_name = 'id') = 'uuid' THEN
    ALTER TABLE "UserAchievement" DROP CONSTRAINT IF EXISTS "UserAchievement_achievementId_fkey";
    ALTER TABLE "Achievement" DROP CONSTRAINT "Achievement_pkey", DROP COLUMN "id", ADD COLUMN "id" UUID NOT NULL, ADD CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id");
    ALTER TABLE "UserAchievement" DROP COLUMN "achievementId", ADD COLUMN "achievementId" UUID NOT NULL;
  END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "BeerPongEvent" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "BeerPongEventStatus" NOT NULL DEFAULT 'DRAFT',
    "beersPerPlayer" INTEGER NOT NULL DEFAULT 2,
    "timeWindowMinutes" INTEGER NOT NULL DEFAULT 5,
    "undoWindowMinutes" INTEGER NOT NULL DEFAULT 5,
    "cancellationPolicy" "CancellationPolicy" NOT NULL DEFAULT 'KEEP_BEERS',
    "startedAt" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "BeerPongEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "BeerPongTeam" (
    "id" UUID NOT NULL,
    "beerPongEventId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "player1Id" UUID NOT NULL,
    "player2Id" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "BeerPongTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "BeerPongGame" (
    "id" UUID NOT NULL,
    "beerPongEventId" UUID NOT NULL,
    "round" "BeerPongRound" NOT NULL,
    "team1Id" UUID NOT NULL,
    "team2Id" UUID NOT NULL,
    "winnerTeamId" UUID,
    "status" "BeerPongGameStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMPTZ(6),
    "endedAt" TIMESTAMPTZ(6),
    "durationSeconds" INTEGER,
    "startedBy" UUID,
    "beersAddedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "BeerPongGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "BeerPongGameBeer" (
    "id" UUID NOT NULL,
    "beerPongGameId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "eventBeerId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BeerPongGameBeer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BeerPongEvent_eventId_idx" ON "BeerPongEvent"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BeerPongEvent_createdBy_idx" ON "BeerPongEvent"("createdBy");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BeerPongTeam_beerPongEventId_idx" ON "BeerPongTeam"("beerPongEventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BeerPongTeam_player1Id_idx" ON "BeerPongTeam"("player1Id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BeerPongTeam_player2Id_idx" ON "BeerPongTeam"("player2Id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BeerPongTeam_beerPongEventId_name_key" ON "BeerPongTeam"("beerPongEventId", "name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BeerPongGame_beerPongEventId_idx" ON "BeerPongGame"("beerPongEventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BeerPongGame_team1Id_idx" ON "BeerPongGame"("team1Id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BeerPongGame_team2Id_idx" ON "BeerPongGame"("team2Id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BeerPongGame_winnerTeamId_idx" ON "BeerPongGame"("winnerTeamId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BeerPongGame_round_idx" ON "BeerPongGame"("round");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BeerPongGameBeer_beerPongGameId_idx" ON "BeerPongGameBeer"("beerPongGameId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BeerPongGameBeer_userId_idx" ON "BeerPongGameBeer"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BeerPongGameBeer_eventBeerId_idx" ON "BeerPongGameBeer"("eventBeerId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BeerPongGameBeer_beerPongGameId_userId_eventBeerId_key" ON "BeerPongGameBeer"("beerPongGameId", "userId", "eventBeerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "BeerPongEvent" ADD CONSTRAINT "BeerPongEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "BeerPongEvent" ADD CONSTRAINT "BeerPongEvent_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "BeerPongTeam" ADD CONSTRAINT "BeerPongTeam_beerPongEventId_fkey" FOREIGN KEY ("beerPongEventId") REFERENCES "BeerPongEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "BeerPongTeam" ADD CONSTRAINT "BeerPongTeam_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "BeerPongTeam" ADD CONSTRAINT "BeerPongTeam_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "BeerPongGame" ADD CONSTRAINT "BeerPongGame_beerPongEventId_fkey" FOREIGN KEY ("beerPongEventId") REFERENCES "BeerPongEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "BeerPongGame" ADD CONSTRAINT "BeerPongGame_team1Id_fkey" FOREIGN KEY ("team1Id") REFERENCES "BeerPongTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "BeerPongGame" ADD CONSTRAINT "BeerPongGame_team2Id_fkey" FOREIGN KEY ("team2Id") REFERENCES "BeerPongTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "BeerPongGame" ADD CONSTRAINT "BeerPongGame_winnerTeamId_fkey" FOREIGN KEY ("winnerTeamId") REFERENCES "BeerPongTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "BeerPongGame" ADD CONSTRAINT "BeerPongGame_startedBy_fkey" FOREIGN KEY ("startedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "BeerPongGameBeer" ADD CONSTRAINT "BeerPongGameBeer_beerPongGameId_fkey" FOREIGN KEY ("beerPongGameId") REFERENCES "BeerPongGame"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "BeerPongGameBeer" ADD CONSTRAINT "BeerPongGameBeer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "BeerPongGameBeer" ADD CONSTRAINT "BeerPongGameBeer_eventBeerId_fkey" FOREIGN KEY ("eventBeerId") REFERENCES "EventBeer"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
