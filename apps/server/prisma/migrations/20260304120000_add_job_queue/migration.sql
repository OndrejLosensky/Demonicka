-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE IF NOT EXISTS "Job" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "result" JSONB,
    "error" TEXT,
    "createdByUserId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "startedAt" TIMESTAMPTZ(6),
    "finishedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Job_createdByUserId_idx" ON "Job"("createdByUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Job_createdAt_idx" ON "Job"("createdAt");

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "Job" ADD CONSTRAINT "Job_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
