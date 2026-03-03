-- Add Beer Pong achievement types (idempotent - 000_baseline may already have them)
DO $$ BEGIN ALTER TYPE "AchievementType" ADD VALUE 'BEER_PONG_GAMES_PLAYED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AchievementType" ADD VALUE 'BEER_PONG_GAMES_WON'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AchievementType" ADD VALUE 'BEER_PONG_FINALS_WON'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

