-- Update any existing events with NULL endDate to have a valid endDate
-- Set endDate to startDate + 1 day as a reasonable default
UPDATE "Event"
SET "endDate" = "startDate" + INTERVAL '1 day'
WHERE "endDate" IS NULL;

-- AlterTable: Make endDate NOT NULL
ALTER TABLE "Event" ALTER COLUMN "endDate" SET NOT NULL;
