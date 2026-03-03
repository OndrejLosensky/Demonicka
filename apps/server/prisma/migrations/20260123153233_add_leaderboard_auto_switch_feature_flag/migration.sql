-- Add LEADERBOARD_AUTO_SWITCH feature flag (idempotent)
INSERT INTO "FeatureFlag" (id, "key", enabled, description, "createdAt", "updatedAt")
SELECT 'f0000000-0000-0000-0000-000000000012'::UUID, 'LEADERBOARD_AUTO_SWITCH'::TEXT, false, 'Povoluje automatické přepínání mezi žebříčkem uživatelů a výsledky beer pongu na stránce žebříčku'::TEXT, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "FeatureFlag" WHERE "key" = 'LEADERBOARD_AUTO_SWITCH');
