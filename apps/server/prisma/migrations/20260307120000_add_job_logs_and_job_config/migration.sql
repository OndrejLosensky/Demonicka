-- AlterTable: Add logs column to Job
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "logs" JSONB;

-- CreateTable: JobConfig for job scheduling (backup.enabled, backup.intervalHours, etc.)
CREATE TABLE IF NOT EXISTS "JobConfig" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedByUserId" UUID,

    CONSTRAINT "JobConfig_pkey" PRIMARY KEY ("key")
);

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "JobConfig" ADD CONSTRAINT "JobConfig_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JobConfig_updatedByUserId_idx" ON "JobConfig"("updatedByUserId");
