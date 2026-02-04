BEGIN;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "email" TEXT,
  ADD COLUMN IF NOT EXISTS "googleId" TEXT,
  ADD COLUMN IF NOT EXISTS "googleProfilePictureUrl" TEXT;

CREATE INDEX IF NOT EXISTS "User_email_idx"
  ON "User"("email");

CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key"
  ON "User"("googleId")
  WHERE "googleId" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "TwoFactorCode" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "used" BOOLEAN NOT NULL DEFAULT false,
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TwoFactorCode_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TwoFactorCode"
  DROP CONSTRAINT IF EXISTS "TwoFactorCode_userId_fkey";

ALTER TABLE "TwoFactorCode"
  ADD CONSTRAINT "TwoFactorCode_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "TwoFactorCode_userId_idx"
  ON "TwoFactorCode"("userId");

SELECT "userId", "achievementId", COUNT(*)
FROM "UserAchievement"
GROUP BY "userId", "achievementId"
HAVING COUNT(*) > 1;

DELETE FROM "UserAchievement" ua
USING "UserAchievement" ua2
WHERE ua.id < ua2.id
  AND ua."userId" = ua2."userId"
  AND ua."achievementId" = ua2."achievementId";

ALTER TABLE "UserAchievement"
  ADD CONSTRAINT "UserAchievement_userId_achievementId_key"
  UNIQUE ("userId", "achievementId");

CREATE INDEX IF NOT EXISTS "UserAchievement_achievementId_idx"
  ON "UserAchievement"("achievementId");

-- Should return 0
SELECT COUNT(*)
FROM "UserAchievement"
GROUP BY "userId", "achievementId"
HAVING COUNT(*) > 1;

-- Should exist
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'TwoFactorCode';

COMMIT;