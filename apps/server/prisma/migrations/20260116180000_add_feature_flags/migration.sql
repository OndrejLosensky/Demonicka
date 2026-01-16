-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- Seed initial feature flags
INSERT INTO "FeatureFlag" (id, "key", enabled, description, "createdAt", "updatedAt") VALUES
('f0000000-0000-0000-0000-000000000001', 'SHOW_DELETED_USERS', false, 'Shows deleted users with option to restore them', NOW(), NOW()),
('f0000000-0000-0000-0000-000000000002', 'SHOW_EVENT_HISTORY', false, 'Shows event history selector in dashboard, leaderboard, users and barrels pages', NOW(), NOW()),
('f0000000-0000-0000-0000-000000000003', 'SHOW_USER_HISTORY', false, 'Shows event history functionality specifically for users page', NOW(), NOW()),
('f0000000-0000-0000-0000-000000000004', 'ACTIVE_EVENT_FUNCTIONALITY', true, 'Enables active event functionality', NOW(), NOW()),
('f0000000-0000-0000-0000-000000000005', 'HISTORY_PAGE', true, 'Enables the history page functionality showing past activities and events', NOW(), NOW()),
('f0000000-0000-0000-0000-000000000006', 'LEADERBOARD_YEAR_FILTER', false, 'Adds year filtering capability to the leaderboard', NOW(), NOW()),
('f0000000-0000-0000-0000-000000000007', 'SHOW_DELETED_BARRELS', false, 'Shows deleted barrels with option to restore them', NOW(), NOW()),
('f0000000-0000-0000-0000-000000000008', 'BARREL_STATUS_TOGGLE', true, 'Enables the status toggle button on barrel items', NOW(), NOW()),
('f0000000-0000-0000-0000-000000000009', 'SHOW_BARRELS_HISTORY', false, 'Shows event history functionality specifically for barrels page', NOW(), NOW()),
('f0000000-0000-0000-0000-000000000010', 'SHOW_DELETED_PARTICIPANTS', false, 'Shows deleted participants with option to restore them', NOW(), NOW()),
('f0000000-0000-0000-0000-000000000011', 'CLEANUP_FUNCTIONALITY', false, 'Enables the cleanup functionality', NOW(), NOW());
