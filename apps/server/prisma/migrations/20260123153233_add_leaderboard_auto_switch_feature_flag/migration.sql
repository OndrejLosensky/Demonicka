-- Add LEADERBOARD_AUTO_SWITCH feature flag
INSERT INTO "FeatureFlag" (id, "key", enabled, description, "createdAt", "updatedAt") VALUES
('f0000000-0000-0000-0000-000000000012', 'LEADERBOARD_AUTO_SWITCH', false, 'Povoluje automatické přepínání mezi žebříčkem uživatelů a výsledky beer pongu na stránce žebříčku', NOW(), NOW());
