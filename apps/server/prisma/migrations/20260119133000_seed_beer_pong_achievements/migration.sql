-- Seed Beer Pong achievements (idempotent via fixed UUIDs)
--
-- Notes:
-- - `Achievement.updatedAt` has no DB default, so we set it explicitly.
-- - Using fixed IDs allows safe re-runs without duplicates.

INSERT INTO "Achievement" (
  "id",
  "name",
  "description",
  "type",
  "category",
  "targetValue",
  "points",
  "icon",
  "isActive",
  "isRepeatable",
  "maxCompletions",
  "createdAt",
  "updatedAt",
  "deletedAt"
)
VALUES
  -- Games played
  (
    'b2b6f6f2-2d1a-4e53-8b51-7e8a3f2b5a01'::uuid,
    'První hra (Beer Pong)',
    'Odehraj 1 hru beer pongu.',
    'BEER_PONG_GAMES_PLAYED',
    'BEGINNER',
    1,
    10,
    '🏓',
    true,
    false,
    1,
    NOW(),
    NOW(),
    NULL
  ),
  (
    'b2b6f6f2-2d1a-4e53-8b51-7e8a3f2b5a02'::uuid,
    'Zahráno 10 her (Beer Pong)',
    'Odehraj 10 her beer pongu.',
    'BEER_PONG_GAMES_PLAYED',
    'INTERMEDIATE',
    10,
    25,
    '🏓',
    true,
    false,
    1,
    NOW(),
    NOW(),
    NULL
  ),
  (
    'b2b6f6f2-2d1a-4e53-8b51-7e8a3f2b5a03'::uuid,
    'Zahráno 50 her (Beer Pong)',
    'Odehraj 50 her beer pongu.',
    'BEER_PONG_GAMES_PLAYED',
    'ADVANCED',
    50,
    60,
    '🏓',
    true,
    false,
    1,
    NOW(),
    NOW(),
    NULL
  ),

  -- Games won
  (
    'b2b6f6f2-2d1a-4e53-8b51-7e8a3f2b5a04'::uuid,
    'První výhra (Beer Pong)',
    'Vyhraj 1 hru beer pongu.',
    'BEER_PONG_GAMES_WON',
    'BEGINNER',
    1,
    15,
    '🏓',
    true,
    false,
    1,
    NOW(),
    NOW(),
    NULL
  ),
  (
    'b2b6f6f2-2d1a-4e53-8b51-7e8a3f2b5a05'::uuid,
    '10 výher (Beer Pong)',
    'Vyhraj 10 her beer pongu.',
    'BEER_PONG_GAMES_WON',
    'INTERMEDIATE',
    10,
    40,
    '🏓',
    true,
    false,
    1,
    NOW(),
    NOW(),
    NULL
  ),
  (
    'b2b6f6f2-2d1a-4e53-8b51-7e8a3f2b5a06'::uuid,
    '25 výher (Beer Pong)',
    'Vyhraj 25 her beer pongu.',
    'BEER_PONG_GAMES_WON',
    'EXPERT',
    25,
    80,
    '🏓',
    true,
    false,
    1,
    NOW(),
    NOW(),
    NULL
  ),

  -- Finals won
  (
    'b2b6f6f2-2d1a-4e53-8b51-7e8a3f2b5a07'::uuid,
    'Vítěz finále (Beer Pong)',
    'Vyhraj 1 finále beer pongu.',
    'BEER_PONG_FINALS_WON',
    'ADVANCED',
    1,
    50,
    '🏓',
    true,
    false,
    1,
    NOW(),
    NOW(),
    NULL
  ),
  (
    'b2b6f6f2-2d1a-4e53-8b51-7e8a3f2b5a08'::uuid,
    '3 vítězství ve finále (Beer Pong)',
    'Vyhraj 3 finále beer pongu.',
    'BEER_PONG_FINALS_WON',
    'EXPERT',
    3,
    90,
    '🏓',
    true,
    false,
    1,
    NOW(),
    NOW(),
    NULL
  ),
  (
    'b2b6f6f2-2d1a-4e53-8b51-7e8a3f2b5a09'::uuid,
    '10 vítězství ve finále (Beer Pong)',
    'Vyhraj 10 finále beer pongu.',
    'BEER_PONG_FINALS_WON',
    'LEGENDARY',
    10,
    150,
    '🏓',
    true,
    false,
    1,
    NOW(),
    NOW(),
    NULL
  )
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "type" = EXCLUDED."type",
  "category" = EXCLUDED."category",
  "targetValue" = EXCLUDED."targetValue",
  "points" = EXCLUDED."points",
  "icon" = EXCLUDED."icon",
  "isActive" = EXCLUDED."isActive",
  "isRepeatable" = EXCLUDED."isRepeatable",
  "maxCompletions" = EXCLUDED."maxCompletions",
  "updatedAt" = NOW(),
  "deletedAt" = NULL;

