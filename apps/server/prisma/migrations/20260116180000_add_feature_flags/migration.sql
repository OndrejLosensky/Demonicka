-- CreateTable (idempotent for 000_baseline)
CREATE TABLE IF NOT EXISTS "FeatureFlag" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- Seed initial feature flags (only when table is empty)
INSERT INTO "FeatureFlag" (id, "key", enabled, description, "createdAt", "updatedAt")
SELECT t.id, t.key, t.enabled, t.description, t."createdAt", t."updatedAt"
FROM (VALUES
('f0000000-0000-0000-0000-000000000001'::UUID, 'SHOW_DELETED_USERS'::TEXT, false::BOOLEAN, 'Shows deleted users with option to restore them'::TEXT, NOW(), NOW()),
('f0000000-0000-0000-0000-000000000002'::UUID, 'SHOW_EVENT_HISTORY'::TEXT, false::BOOLEAN, 'Shows event history selector in dashboard, leaderboard, users and barrels pages'::TEXT, NOW(), NOW()),
('f0000000-0000-0000-0000-000000000003'::UUID, 'SHOW_USER_HISTORY'::TEXT, false::BOOLEAN, 'Shows event history functionality specifically for users page'::TEXT, NOW(), NOW()),
('f0000000-0000-0000-0000-000000000004'::UUID, 'ACTIVE_EVENT_FUNCTIONALITY'::TEXT, true::BOOLEAN, 'Enables active event functionality'::TEXT, NOW(), NOW()),
('f0000000-0000-0000-0000-000000000005'::UUID, 'HISTORY_PAGE'::TEXT, true::BOOLEAN, 'Enables the history page functionality showing past activities and events'::TEXT, NOW(), NOW()),
('f0000000-0000-0000-0000-000000000006'::UUID, 'LEADERBOARD_YEAR_FILTER'::TEXT, false::BOOLEAN, 'Adds year filtering capability to the leaderboard'::TEXT, NOW(), NOW()),
('f0000000-0000-0000-0000-000000000007'::UUID, 'SHOW_DELETED_BARRELS'::TEXT, false::BOOLEAN, 'Shows deleted barrels with option to restore them'::TEXT, NOW(), NOW()),
('f0000000-0000-0000-0000-000000000008'::UUID, 'BARREL_STATUS_TOGGLE'::TEXT, true::BOOLEAN, 'Enables the status toggle button on barrel items'::TEXT, NOW(), NOW()),
('f0000000-0000-0000-0000-000000000009'::UUID, 'SHOW_BARRELS_HISTORY'::TEXT, false::BOOLEAN, 'Shows event history functionality specifically for barrels page'::TEXT, NOW(), NOW()),
('f0000000-0000-0000-0000-000000000010'::UUID, 'SHOW_DELETED_PARTICIPANTS'::TEXT, false::BOOLEAN, 'Shows deleted participants with option to restore them'::TEXT, NOW(), NOW()),
('f0000000-0000-0000-0000-000000000011'::UUID, 'CLEANUP_FUNCTIONALITY'::TEXT, false::BOOLEAN, 'Enables the cleanup functionality'::TEXT, NOW(), NOW())
) AS t(id, key, enabled, description, "createdAt", "updatedAt")
WHERE (SELECT COUNT(*) FROM "FeatureFlag") = 0;
