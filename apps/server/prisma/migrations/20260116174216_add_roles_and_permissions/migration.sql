-- CreateTable (idempotent for 000_baseline)
CREATE TABLE IF NOT EXISTS "Role" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Permission" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "RolePermission" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed Roles (only when table is empty, e.g. 000_baseline not applied)
INSERT INTO "Role" ("id", "name", "description", "createdAt", "updatedAt")
SELECT t.id, t.name, t.description, t."createdAt", t."updatedAt"
FROM (VALUES
(gen_random_uuid(), 'SUPER_ADMIN'::TEXT, 'Super Administrator with full system access'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'OPERATOR'::TEXT, 'Operator who can manage events they created'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'USER'::TEXT, 'Regular user with standard permissions'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'PARTICIPANT'::TEXT, 'Participant with no login access'::TEXT, NOW(), NOW())
) AS t(id, name, description, "createdAt", "updatedAt")
WHERE (SELECT COUNT(*) FROM "Role") = 0;

-- Seed Permissions (only when table is empty)
INSERT INTO "Permission" ("id", "name", "description", "createdAt", "updatedAt")
SELECT t.id, t.name, t.description, t."createdAt", t."updatedAt"
FROM (VALUES
(gen_random_uuid(), 'CREATE_EVENT'::TEXT, 'Create new events'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'UPDATE_EVENT'::TEXT, 'Update existing events'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'DELETE_EVENT'::TEXT, 'Delete events'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'VIEW_ALL_EVENTS'::TEXT, 'View all events in the system'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'VIEW_OWN_EVENTS'::TEXT, 'View events user is part of or created'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'MANAGE_EVENT_USERS'::TEXT, 'Manage users in events'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'MANAGE_EVENT_BARRELS'::TEXT, 'Manage barrels in events'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'SET_EVENT_ACTIVE'::TEXT, 'Set event as active'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'END_EVENT'::TEXT, 'End an event'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'MANAGE_USERS'::TEXT, 'Manage all users'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'CREATE_USER'::TEXT, 'Create new users'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'UPDATE_USER'::TEXT, 'Update existing users'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'DELETE_USER'::TEXT, 'Delete users'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'VIEW_ALL_USERS'::TEXT, 'View all users in the system'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'MANAGE_PARTICIPANTS'::TEXT, 'Manage participants'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'CREATE_PARTICIPANT'::TEXT, 'Create new participants'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'UPDATE_PARTICIPANT'::TEXT, 'Update existing participants'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'DELETE_PARTICIPANT'::TEXT, 'Delete participants'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'MANAGE_BARRELS'::TEXT, 'Manage all barrels'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'CREATE_BARREL'::TEXT, 'Create new barrels'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'UPDATE_BARREL'::TEXT, 'Update existing barrels'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'DELETE_BARREL'::TEXT, 'Delete barrels'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'ADD_BEER'::TEXT, 'Add beer to events'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'REMOVE_BEER'::TEXT, 'Remove beer from events'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'VIEW_BEERS'::TEXT, 'View beer data'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'MANAGE_BEERS'::TEXT, 'Manage all beer data'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'VIEW_DASHBOARD'::TEXT, 'View dashboard'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'VIEW_SYSTEM_DASHBOARD'::TEXT, 'View system dashboard'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'MANAGE_SYSTEM'::TEXT, 'Manage system settings'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'VIEW_SYSTEM_STATS'::TEXT, 'View system statistics'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'MANAGE_BACKUPS'::TEXT, 'Manage system backups'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'VIEW_LEADERBOARD'::TEXT, 'View leaderboard'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'MANAGE_ACHIEVEMENTS'::TEXT, 'Manage achievements'::TEXT, NOW(), NOW()),
(gen_random_uuid(), 'VIEW_ACHIEVEMENTS'::TEXT, 'View achievements'::TEXT, NOW(), NOW())
) AS t(id, name, description, "createdAt", "updatedAt")
WHERE (SELECT COUNT(*) FROM "Permission") = 0;

-- Seed Role-Permission relationships (only when RolePermission is empty)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM "RolePermission") = 0 THEN
    INSERT INTO "RolePermission" ("roleId", "permissionId")
    SELECT r.id, p.id FROM "Role" r CROSS JOIN "Permission" p WHERE r.name = 'SUPER_ADMIN';

    INSERT INTO "RolePermission" ("roleId", "permissionId")
    SELECT r.id, p.id FROM "Role" r CROSS JOIN "Permission" p
    WHERE r.name = 'OPERATOR' AND p.name IN (
      'CREATE_EVENT', 'UPDATE_EVENT', 'DELETE_EVENT', 'VIEW_OWN_EVENTS',
      'MANAGE_EVENT_USERS', 'MANAGE_EVENT_BARRELS', 'SET_EVENT_ACTIVE', 'END_EVENT',
      'MANAGE_PARTICIPANTS', 'CREATE_PARTICIPANT', 'UPDATE_PARTICIPANT', 'DELETE_PARTICIPANT',
      'MANAGE_BARRELS', 'CREATE_BARREL', 'UPDATE_BARREL', 'DELETE_BARREL',
      'ADD_BEER', 'REMOVE_BEER', 'VIEW_BEERS', 'MANAGE_BEERS',
      'VIEW_DASHBOARD', 'VIEW_LEADERBOARD', 'VIEW_ACHIEVEMENTS'
    );

    INSERT INTO "RolePermission" ("roleId", "permissionId")
    SELECT r.id, p.id FROM "Role" r CROSS JOIN "Permission" p
    WHERE r.name = 'USER' AND p.name IN (
      'VIEW_OWN_EVENTS', 'ADD_BEER', 'VIEW_BEERS',
      'VIEW_DASHBOARD', 'VIEW_LEADERBOARD', 'VIEW_ACHIEVEMENTS'
    );
  END IF;
END $$;

-- PARTICIPANT has no permissions (empty set)
