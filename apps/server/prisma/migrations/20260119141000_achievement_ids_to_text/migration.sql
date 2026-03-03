-- Align Achievement IDs to slug-style (TEXT), matching existing data.
-- Idempotent: skip when 000_baseline already has TEXT types.

ALTER TABLE "UserAchievement" DROP CONSTRAINT IF EXISTS "UserAchievement_achievementId_fkey";

-- Convert UserAchievement.achievementId to TEXT (no-op if already TEXT)
ALTER TABLE "UserAchievement"
  ALTER COLUMN "achievementId" SET DATA TYPE TEXT
  USING "achievementId"::text;

-- Convert Achievement.id to TEXT (recreate PK) - no-op if already TEXT
ALTER TABLE "Achievement" DROP CONSTRAINT IF EXISTS "Achievement_pkey";
ALTER TABLE "Achievement"
  ALTER COLUMN "id" SET DATA TYPE TEXT
  USING "id"::text;
DO $$ BEGIN ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id"); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Re-add foreign key constraint
DO $$ BEGIN ALTER TABLE "UserAchievement"
  ADD CONSTRAINT "UserAchievement_achievementId_fkey"
  FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id")
  ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

