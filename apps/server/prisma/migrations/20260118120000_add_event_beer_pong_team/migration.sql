-- CreateTable (idempotent for 000_baseline)
CREATE TABLE IF NOT EXISTS "EventBeerPongTeam" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "player1Id" UUID NOT NULL,
    "player2Id" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "EventBeerPongTeam_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EventBeerPongTeam_eventId_name_key" ON "EventBeerPongTeam"("eventId", "name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventBeerPongTeam_eventId_idx" ON "EventBeerPongTeam"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventBeerPongTeam_player1Id_idx" ON "EventBeerPongTeam"("player1Id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventBeerPongTeam_player2Id_idx" ON "EventBeerPongTeam"("player2Id");

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "EventBeerPongTeam" ADD CONSTRAINT "EventBeerPongTeam_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "EventBeerPongTeam" ADD CONSTRAINT "EventBeerPongTeam_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "EventBeerPongTeam" ADD CONSTRAINT "EventBeerPongTeam_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AlterTable: add eventBeerPongTeamId to BeerPongTeam
ALTER TABLE "BeerPongTeam" ADD COLUMN IF NOT EXISTS "eventBeerPongTeamId" UUID;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BeerPongTeam_eventBeerPongTeamId_idx" ON "BeerPongTeam"("eventBeerPongTeamId");

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "BeerPongTeam" ADD CONSTRAINT "BeerPongTeam_eventBeerPongTeamId_fkey" FOREIGN KEY ("eventBeerPongTeamId") REFERENCES "EventBeerPongTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
