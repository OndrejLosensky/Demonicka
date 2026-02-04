-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
DO $$ BEGIN
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'OPERATOR', 'USER', 'PARTICIPANT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
-- CreateEnum
DO $$ BEGIN
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
-- CreateEnum
DO $$ BEGIN
CREATE TYPE "DeviceType" AS ENUM ('ios', 'android', 'web');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
-- CreateEnum
DO $$ BEGIN
CREATE TYPE "AchievementType" AS ENUM ('EVENT_WIN', 'BEERS_IN_EVENT', 'BEERS_IN_HOUR', 'EVENTS_PARTICIPATED', 'TOTAL_BEERS', 'CONSECUTIVE_DAYS', 'FIRST_BEER', 'MILESTONE', 'BEER_PONG_GAMES_PLAYED', 'BEER_PONG_GAMES_WON', 'BEER_PONG_FINALS_WON');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
-- CreateEnum
DO $$ BEGIN
CREATE TYPE "AchievementCategory" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'LEGENDARY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
-- CreateEnum
DO $$ BEGIN
CREATE TYPE "BeerPongEventStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
-- CreateEnum
DO $$ BEGIN
CREATE TYPE "BeerPongGameStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
-- CreateEnum
DO $$ BEGIN
CREATE TYPE "BeerPongRound" AS ENUM ('QUARTERFINAL', 'SEMIFINAL', 'FINAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
-- CreateEnum
DO $$ BEGIN
CREATE TYPE "CancellationPolicy" AS ENUM ('KEEP_BEERS', 'REMOVE_BEERS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
-- CreateEnum
DO $$ BEGIN
CREATE TYPE "EventRegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
-- CreateEnum
DO $$ BEGIN
CREATE TYPE "BeerSize" AS ENUM ('SMALL', 'LARGE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
-- CreateEnum
DO $$ BEGIN
CREATE TYPE "LeaderboardViewMode" AS ENUM ('LEADERBOARD', 'BEER_PONG', 'AUTO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "email" TEXT,
    "googleId" TEXT,
    "name" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "gender" "Gender" NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PARTICIPANT',
    "beerCount" INTEGER NOT NULL DEFAULT 0,
    "lastBeerTime" TIMESTAMPTZ(6),
    "registrationToken" TEXT,
    "isRegistrationComplete" BOOLEAN NOT NULL DEFAULT false,
    "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "canLogin" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" UUID,
    "allowedIPs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastAdminLogin" TIMESTAMPTZ(6),
    "profilePictureUrl" TEXT,
    "googleProfilePictureUrl" TEXT,
    "preferredTheme" TEXT,
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "reasonRevoked" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "deviceType" "DeviceType" NOT NULL DEFAULT 'web',
    "deviceName" TEXT,
    "deviceModel" TEXT,
    "osVersion" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" TIMESTAMPTZ(6),
    "userId" UUID NOT NULL,
    "isAdminDevice" BOOLEAN NOT NULL DEFAULT false,
    "biometricEnabled" BOOLEAN,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Barrel" (
    "id" UUID NOT NULL,
    "size" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "orderNumber" INTEGER NOT NULL,
    "remainingBeers" INTEGER NOT NULL,
    "totalBeers" INTEGER NOT NULL,
    "remainingLitres" DECIMAL(10,2) NOT NULL,
    "totalLitres" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Barrel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beer" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "barrelId" UUID,
    "beerSize" "BeerSize" NOT NULL DEFAULT 'LARGE',
    "volumeLitres" DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Beer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMPTZ(6) NOT NULL,
    "endDate" TIMESTAMPTZ(6) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "registrationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "registrationToken" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventBeerPongTeam" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "player1Id" UUID NOT NULL,
    "player2Id" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "EventBeerPongTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventBeer" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "barrelId" UUID,
    "spilled" BOOLEAN NOT NULL DEFAULT false,
    "beerSize" "BeerSize" NOT NULL DEFAULT 'LARGE',
    "volumeLitres" DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    "consumedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "EventBeer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "AchievementType" NOT NULL,
    "category" "AchievementCategory" NOT NULL DEFAULT 'BEGINNER',
    "targetValue" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRepeatable" BOOLEAN NOT NULL DEFAULT false,
    "maxCompletions" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "achievementId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMPTZ(6),
    "completionCount" INTEGER NOT NULL DEFAULT 0,
    "lastProgressUpdate" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventUsers" (
    "eventId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "EventUsers_pkey" PRIMARY KEY ("eventId","userId")
);

-- CreateTable
CREATE TABLE "EventBarrels" (
    "eventId" UUID NOT NULL,
    "barrelId" UUID NOT NULL,

    CONSTRAINT "EventBarrels_pkey" PRIMARY KEY ("eventId","barrelId")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "rawName" TEXT NOT NULL,
    "participating" BOOLEAN NOT NULL DEFAULT true,
    "arrivalTime" TIMESTAMPTZ(6),
    "leaveTime" TIMESTAMPTZ(6),
    "matchedUserId" UUID,
    "matchConfidence" DECIMAL(5,4),
    "status" "EventRegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeerPongDefaults" (
    "id" UUID NOT NULL,
    "beersPerPlayer" INTEGER NOT NULL DEFAULT 2,
    "timeWindowMinutes" INTEGER NOT NULL DEFAULT 5,
    "undoWindowMinutes" INTEGER NOT NULL DEFAULT 5,
    "cancellationPolicy" "CancellationPolicy" NOT NULL DEFAULT 'KEEP_BEERS',
    "updatedBy" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "BeerPongDefaults_pkey" PRIMARY KEY ("id")
);

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
    "beerSize" "BeerSize",
    "beerVolumeLitres" DECIMAL(3,2),
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
    "eventBeerPongTeamId" UUID,
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
    "team1Id" UUID,
    "team2Id" UUID,
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

-- CreateTable
CREATE TABLE "TwoFactorCode" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TwoFactorCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_registrationToken_key" ON "User"("registrationToken");

-- CreateIndex
CREATE INDEX "User_createdBy_idx" ON "User"("createdBy");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_googleId_idx" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "DeviceToken_userId_idx" ON "DeviceToken"("userId");

-- CreateIndex
CREATE INDEX "DeviceToken_token_idx" ON "DeviceToken"("token");

-- CreateIndex
CREATE INDEX "Beer_userId_idx" ON "Beer"("userId");

-- CreateIndex
CREATE INDEX "Beer_barrelId_idx" ON "Beer"("barrelId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_registrationToken_key" ON "Event"("registrationToken");

-- CreateIndex
CREATE INDEX "Event_createdBy_idx" ON "Event"("createdBy");

-- CreateIndex
CREATE INDEX "EventBeerPongTeam_eventId_idx" ON "EventBeerPongTeam"("eventId");

-- CreateIndex
CREATE INDEX "EventBeerPongTeam_player1Id_idx" ON "EventBeerPongTeam"("player1Id");

-- CreateIndex
CREATE INDEX "EventBeerPongTeam_player2Id_idx" ON "EventBeerPongTeam"("player2Id");

-- CreateIndex
CREATE UNIQUE INDEX "EventBeerPongTeam_eventId_name_key" ON "EventBeerPongTeam"("eventId", "name");

-- CreateIndex
CREATE INDEX "EventBeer_eventId_idx" ON "EventBeer"("eventId");

-- CreateIndex
CREATE INDEX "EventBeer_userId_idx" ON "EventBeer"("userId");

-- CreateIndex
CREATE INDEX "EventBeer_barrelId_idx" ON "EventBeer"("barrelId");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");

-- CreateIndex
CREATE INDEX "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "EventUsers_userId_idx" ON "EventUsers"("userId");

-- CreateIndex
CREATE INDEX "EventBarrels_barrelId_idx" ON "EventBarrels"("barrelId");

-- CreateIndex
CREATE INDEX "EventRegistration_eventId_idx" ON "EventRegistration"("eventId");

-- CreateIndex
CREATE INDEX "EventRegistration_status_idx" ON "EventRegistration"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "BeerPongDefaults_updatedBy_idx" ON "BeerPongDefaults"("updatedBy");

-- CreateIndex
CREATE INDEX "LeaderboardViewSettings_updatedBy_idx" ON "LeaderboardViewSettings"("updatedBy");

-- CreateIndex
CREATE INDEX "LeaderboardViewSettings_selectedBeerPongEventId_idx" ON "LeaderboardViewSettings"("selectedBeerPongEventId");

-- CreateIndex
CREATE INDEX "BeerPongEvent_eventId_idx" ON "BeerPongEvent"("eventId");

-- CreateIndex
CREATE INDEX "BeerPongEvent_createdBy_idx" ON "BeerPongEvent"("createdBy");

-- CreateIndex
CREATE INDEX "BeerPongTeam_beerPongEventId_idx" ON "BeerPongTeam"("beerPongEventId");

-- CreateIndex
CREATE INDEX "BeerPongTeam_eventBeerPongTeamId_idx" ON "BeerPongTeam"("eventBeerPongTeamId");

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
CREATE INDEX "TwoFactorCode_userId_idx" ON "TwoFactorCode"("userId");

-- CreateIndex
CREATE INDEX "TwoFactorCode_code_idx" ON "TwoFactorCode"("code");

-- CreateIndex
CREATE INDEX "TwoFactorCode_expiresAt_idx" ON "TwoFactorCode"("expiresAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beer" ADD CONSTRAINT "Beer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beer" ADD CONSTRAINT "Beer_barrelId_fkey" FOREIGN KEY ("barrelId") REFERENCES "Barrel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBeerPongTeam" ADD CONSTRAINT "EventBeerPongTeam_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBeerPongTeam" ADD CONSTRAINT "EventBeerPongTeam_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBeerPongTeam" ADD CONSTRAINT "EventBeerPongTeam_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBeer" ADD CONSTRAINT "EventBeer_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBeer" ADD CONSTRAINT "EventBeer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBeer" ADD CONSTRAINT "EventBeer_barrelId_fkey" FOREIGN KEY ("barrelId") REFERENCES "Barrel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventUsers" ADD CONSTRAINT "EventUsers_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventUsers" ADD CONSTRAINT "EventUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBarrels" ADD CONSTRAINT "EventBarrels_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBarrels" ADD CONSTRAINT "EventBarrels_barrelId_fkey" FOREIGN KEY ("barrelId") REFERENCES "Barrel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_matchedUserId_fkey" FOREIGN KEY ("matchedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeerPongEvent" ADD CONSTRAINT "BeerPongEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeerPongEvent" ADD CONSTRAINT "BeerPongEvent_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeerPongTeam" ADD CONSTRAINT "BeerPongTeam_beerPongEventId_fkey" FOREIGN KEY ("beerPongEventId") REFERENCES "BeerPongEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeerPongTeam" ADD CONSTRAINT "BeerPongTeam_eventBeerPongTeamId_fkey" FOREIGN KEY ("eventBeerPongTeamId") REFERENCES "EventBeerPongTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeerPongTeam" ADD CONSTRAINT "BeerPongTeam_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeerPongTeam" ADD CONSTRAINT "BeerPongTeam_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeerPongGame" ADD CONSTRAINT "BeerPongGame_beerPongEventId_fkey" FOREIGN KEY ("beerPongEventId") REFERENCES "BeerPongEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeerPongGame" ADD CONSTRAINT "BeerPongGame_team1Id_fkey" FOREIGN KEY ("team1Id") REFERENCES "BeerPongTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeerPongGame" ADD CONSTRAINT "BeerPongGame_team2Id_fkey" FOREIGN KEY ("team2Id") REFERENCES "BeerPongTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "TwoFactorCode" ADD CONSTRAINT "TwoFactorCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

