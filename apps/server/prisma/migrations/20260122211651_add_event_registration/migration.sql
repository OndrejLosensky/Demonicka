-- CreateEnum (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE "EventRegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "registrationEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "registrationToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Event_registrationToken_key" ON "Event"("registrationToken");

-- CreateTable
CREATE TABLE IF NOT EXISTS "EventRegistration" (
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

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EventRegistration_eventId_idx" ON "EventRegistration"("eventId");
CREATE INDEX IF NOT EXISTS "EventRegistration_status_idx" ON "EventRegistration"("status");

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_matchedUserId_fkey" FOREIGN KEY ("matchedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
