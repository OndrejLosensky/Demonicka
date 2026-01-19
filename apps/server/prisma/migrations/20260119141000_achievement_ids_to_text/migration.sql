-- Align Achievement IDs to slug-style (TEXT), matching existing data.
-- Converts Achievement.id and UserAchievement.achievementId to TEXT and restores FK.

ALTER TABLE "UserAchievement" DROP CONSTRAINT IF EXISTS "UserAchievement_achievementId_fkey";

-- Convert UserAchievement.achievementId to TEXT
ALTER TABLE "UserAchievement"
  ALTER COLUMN "achievementId" SET DATA TYPE TEXT
  USING "achievementId"::text;

-- Convert Achievement.id to TEXT (recreate PK)
ALTER TABLE "Achievement" DROP CONSTRAINT IF EXISTS "Achievement_pkey";
ALTER TABLE "Achievement"
  ALTER COLUMN "id" SET DATA TYPE TEXT
  USING "id"::text;
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id");

-- Re-add foreign key constraint
ALTER TABLE "UserAchievement"
  ADD CONSTRAINT "UserAchievement_achievementId_fkey"
  FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

