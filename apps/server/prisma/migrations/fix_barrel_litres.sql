-- Fix barrel litres: Barrel size is already in litres, not beer count
-- This script corrects barrels that were incorrectly calculated as size * 0.5
-- Run this after the migration to fix existing barrels

-- First, fix totalLitres to equal size (barrel size is already in litres)
UPDATE "Barrel" 
SET "totalLitres" = "size"
WHERE "totalLitres" != "size" OR "totalLitres" IS NULL;

-- Then, recalculate remainingLitres based on actual consumption
-- For each barrel, calculate: totalLitres - sum of all volumeLitres consumed from that barrel
UPDATE "Barrel" b
SET "remainingLitres" = GREATEST(0, 
  b."totalLitres" - COALESCE((
    SELECT SUM(eb."volumeLitres")
    FROM "EventBeer" eb
    WHERE eb."barrelId" = b.id
      AND eb."deletedAt" IS NULL
  ), 0)
)
WHERE b."deletedAt" IS NULL;
