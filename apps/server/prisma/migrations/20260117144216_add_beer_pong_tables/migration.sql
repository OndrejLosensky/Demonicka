/*
  Warnings:

  - The primary key for the `Achievement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `Achievement` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `achievementId` on the `UserAchievement` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "BeerPongEventStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BeerPongGameStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BeerPongRound" AS ENUM ('QUARTERFINAL', 'SEMIFINAL', 'FINAL');

-- CreateEnum
CREATE TYPE "CancellationPolicy" AS ENUM ('KEEP_BEERS', 'REMOVE_BEERS');

-- DropForeignKey
ALTER TABLE "UserAchievement" DROP CONSTRAINT "UserAchievement_achievementId_fkey";

-- AlterTable
ALTER TABLE "Achievement" DROP CONSTRAINT "Achievement_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "UserAchievement" DROP COLUMN "achievementId",
ADD COLUMN     "achievementId" UUID NOT NULL;

-- CreateTable
CREATE TABLE "BeerPongEvent" (
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
CREATE TABLE "BeerPongTeam" (
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
CREATE TABLE "BeerPongGame" (
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
CREATE TABLE "BeerPongGameBeer" (
    "id" UUID NOT NULL,
    "beerPongGameId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "eventBeerId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BeerPongGameBeer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BeerPongEvent_eventId_idx" ON "BeerPongEvent"("eventId");

-- CreateIndex
CREATE INDEX "BeerPongEvent_createdBy_idx" ON "BeerPongEvent"("createdBy");

-- CreateIndex
CREATE INDEX "BeerPongTeam_beerPongEventId_idx" ON "BeerPongTeam"("beerPongEventId");

-- CreateIndex
CREATE INDEX "BeerPongTeam_player1Id_idx" ON "BeerPongTeam"("player1Id");

-- CreateIndex
CREATE INDEX "BeerPongTeam_player2Id_idx" ON "BeerPongTeam"("player2Id");

-- CreateIndex
CREATE UNIQUE INDEX "BeerPongTeam_beerPongEventId_name_key" ON "BeerPongTeam"("beerPongEventId", "name");

-- CreateIndex
CREATE INDEX "BeerPongGame_beerPongEventId_idx" ON "BeerPongGame"("beerPongEventId");

-- CreateIndex
CREATE INDEX "BeerPongGame_team1Id_idx" ON "BeerPongGame"("team1Id");

-- CreateIndex
CREATE INDEX "BeerPongGame_team2Id_idx" ON "BeerPongGame"("team2Id");

-- CreateIndex
CREATE INDEX "BeerPongGame_winnerTeamId_idx" ON "BeerPongGame"("winnerTeamId");

-- CreateIndex
CREATE INDEX "BeerPongGame_round_idx" ON "BeerPongGame"("round");

-- CreateIndex
CREATE INDEX "BeerPongGameBeer_beerPongGameId_idx" ON "BeerPongGameBeer"("beerPongGameId");

-- CreateIndex
CREATE INDEX "BeerPongGameBeer_userId_idx" ON "BeerPongGameBeer"("userId");

-- CreateIndex
CREATE INDEX "BeerPongGameBeer_eventBeerId_idx" ON "BeerPongGameBeer"("eventBeerId");

-- CreateIndex
CREATE UNIQUE INDEX "BeerPongGameBeer_beerPongGameId_userId_eventBeerId_key" ON "BeerPongGameBeer"("beerPongGameId", "userId", "eventBeerId");

-- CreateIndex
CREATE INDEX "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeerPongEvent" ADD CONSTRAINT "BeerPongEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeerPongEvent" ADD CONSTRAINT "BeerPongEvent_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeerPongTeam" ADD CONSTRAINT "BeerPongTeam_beerPongEventId_fkey" FOREIGN KEY ("beerPongEventId") REFERENCES "BeerPongEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeerPongTeam" ADD CONSTRAINT "BeerPongTeam_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeerPongTeam" ADD CONSTRAINT "BeerPongTeam_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeerPongGame" ADD CONSTRAINT "BeerPongGame_beerPongEventId_fkey" FOREIGN KEY ("beerPongEventId") REFERENCES "BeerPongEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeerPongGame" ADD CONSTRAINT "BeerPongGame_team1Id_fkey" FOREIGN KEY ("team1Id") REFERENCES "BeerPongTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeerPongGame" ADD CONSTRAINT "BeerPongGame_team2Id_fkey" FOREIGN KEY ("team2Id") REFERENCES "BeerPongTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeerPongGame" ADD CONSTRAINT "BeerPongGame_winnerTeamId_fkey" FOREIGN KEY ("winnerTeamId") REFERENCES "BeerPongTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeerPongGame" ADD CONSTRAINT "BeerPongGame_startedBy_fkey" FOREIGN KEY ("startedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeerPongGameBeer" ADD CONSTRAINT "BeerPongGameBeer_beerPongGameId_fkey" FOREIGN KEY ("beerPongGameId") REFERENCES "BeerPongGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeerPongGameBeer" ADD CONSTRAINT "BeerPongGameBeer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeerPongGameBeer" ADD CONSTRAINT "BeerPongGameBeer_eventBeerId_fkey" FOREIGN KEY ("eventBeerId") REFERENCES "EventBeer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
