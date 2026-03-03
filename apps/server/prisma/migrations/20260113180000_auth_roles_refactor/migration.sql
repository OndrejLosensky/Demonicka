-- AlterEnum: Add SUPER_ADMIN and rename ADMIN to OPERATOR
-- Only run when UserRole still has old values (skip when 000_baseline already applied)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'UserRole' AND e.enumlabel = 'ADMIN') THEN
    -- Step 1: Create new enum type with correct values
    CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'OPERATOR', 'USER', 'PARTICIPANT');
    -- Step 2: Remove the default temporarily
    ALTER TABLE "User" ALTER COLUMN role DROP DEFAULT;
    -- Step 3: Alter the column to use the new enum type (converting ADMIN to OPERATOR)
    ALTER TABLE "User" ALTER COLUMN role TYPE "UserRole_new" USING (
      CASE role::text
        WHEN 'ADMIN' THEN 'OPERATOR'::"UserRole_new"
        WHEN 'USER' THEN 'USER'::"UserRole_new"
        WHEN 'PARTICIPANT' THEN 'PARTICIPANT'::"UserRole_new"
        ELSE 'PARTICIPANT'::"UserRole_new"
      END
    );
    -- Step 4: Restore the default with the new enum type
    ALTER TABLE "User" ALTER COLUMN role SET DEFAULT 'PARTICIPANT'::"UserRole_new";
    -- Step 5: Drop the old enum and rename the new one
    DROP TYPE "UserRole";
    ALTER TYPE "UserRole_new" RENAME TO "UserRole";
  END IF;
END $$;

-- Add canLogin column
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canLogin" BOOLEAN NOT NULL DEFAULT true;

-- Set canLogin based on role (PARTICIPANT = false, others = true)
UPDATE "User" SET "canLogin" = false WHERE role = 'PARTICIPANT';
UPDATE "User" SET "canLogin" = true WHERE role != 'PARTICIPANT';

-- Add createdBy column to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdBy" UUID;

-- Add foreign key constraint for createdBy
DO $$ BEGIN ALTER TABLE "User" ADD CONSTRAINT "User_createdBy_fkey" 
  FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add index for createdBy
CREATE INDEX IF NOT EXISTS "User_createdBy_idx" ON "User"("createdBy");

-- Add createdBy column to Event
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "createdBy" UUID;

-- Add foreign key constraint for Event.createdBy
DO $$ BEGIN ALTER TABLE "Event" ADD CONSTRAINT "Event_createdBy_fkey" 
  FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add index for Event.createdBy
CREATE INDEX IF NOT EXISTS "Event_createdBy_idx" ON "Event"("createdBy");

-- Remove isAdminLoginEnabled column (data migration: set canLogin based on old value if needed)
ALTER TABLE "User" DROP COLUMN IF EXISTS "isAdminLoginEnabled";
