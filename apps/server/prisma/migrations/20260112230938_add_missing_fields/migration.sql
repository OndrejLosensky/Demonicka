/*
  Warnings:

  - The primary key for the `Achievement` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- Drop foreign key constraint first
ALTER TABLE "UserAchievement" DROP CONSTRAINT IF EXISTS "UserAchievement_achievementId_fkey";

-- Update UserAchievement achievementId column type first
ALTER TABLE "UserAchievement" ALTER COLUMN "achievementId" SET DATA TYPE TEXT;

-- AlterTable Achievement
ALTER TABLE "Achievement" DROP CONSTRAINT "Achievement_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id");

-- Re-add foreign key constraint
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" 
  FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "EventBeer" ADD COLUMN     "spilled" BOOLEAN NOT NULL DEFAULT false;
