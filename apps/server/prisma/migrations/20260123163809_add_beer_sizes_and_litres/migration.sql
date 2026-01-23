-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "BeerSize" AS ENUM ('SMALL', 'LARGE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable: Add beerSize and volumeLitres to Beer
ALTER TABLE "Beer" ADD COLUMN IF NOT EXISTS "beerSize" "BeerSize" NOT NULL DEFAULT 'LARGE';
ALTER TABLE "Beer" ADD COLUMN IF NOT EXISTS "volumeLitres" DECIMAL(3,2) NOT NULL DEFAULT 0.5;

-- AlterTable: Add beerSize and volumeLitres to EventBeer
ALTER TABLE "EventBeer" ADD COLUMN IF NOT EXISTS "beerSize" "BeerSize" NOT NULL DEFAULT 'LARGE';
ALTER TABLE "EventBeer" ADD COLUMN IF NOT EXISTS "volumeLitres" DECIMAL(3,2) NOT NULL DEFAULT 0.5;

-- AlterTable: Add remainingLitres and totalLitres to Barrel
ALTER TABLE "Barrel" ADD COLUMN IF NOT EXISTS "remainingLitres" DECIMAL(10,2);
ALTER TABLE "Barrel" ADD COLUMN IF NOT EXISTS "totalLitres" DECIMAL(10,2);

-- AlterTable: Add beerSize and beerVolumeLitres to BeerPongEvent (optional fields)
ALTER TABLE "BeerPongEvent" ADD COLUMN IF NOT EXISTS "beerSize" "BeerSize";
ALTER TABLE "BeerPongEvent" ADD COLUMN IF NOT EXISTS "beerVolumeLitres" DECIMAL(3,2);

-- Backfill existing data
-- All existing beers default to LARGE 0.5L (already set by DEFAULT)
-- Calculate litres for existing barrels: size * 0.5 (assuming all historical beers were 0.5L)
UPDATE "Barrel" 
SET 
  "totalLitres" = "size" * 0.5,
  "remainingLitres" = "remainingBeers" * 0.5
WHERE "totalLitres" IS NULL OR "remainingLitres" IS NULL;

-- Make litres fields NOT NULL after backfilling
ALTER TABLE "Barrel" ALTER COLUMN "remainingLitres" SET NOT NULL;
ALTER TABLE "Barrel" ALTER COLUMN "totalLitres" SET NOT NULL;
