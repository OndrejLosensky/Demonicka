-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed Roles
INSERT INTO "Role" ("id", "name", "description", "createdAt", "updatedAt") VALUES
(gen_random_uuid(), 'SUPER_ADMIN', 'Super Administrator with full system access', NOW(), NOW()),
(gen_random_uuid(), 'OPERATOR', 'Operator who can manage events they created', NOW(), NOW()),
(gen_random_uuid(), 'USER', 'Regular user with standard permissions', NOW(), NOW()),
(gen_random_uuid(), 'PARTICIPANT', 'Participant with no login access', NOW(), NOW());

-- Seed Permissions
INSERT INTO "Permission" ("id", "name", "description", "createdAt", "updatedAt") VALUES
(gen_random_uuid(), 'CREATE_EVENT', 'Create new events', NOW(), NOW()),
(gen_random_uuid(), 'UPDATE_EVENT', 'Update existing events', NOW(), NOW()),
(gen_random_uuid(), 'DELETE_EVENT', 'Delete events', NOW(), NOW()),
(gen_random_uuid(), 'VIEW_ALL_EVENTS', 'View all events in the system', NOW(), NOW()),
(gen_random_uuid(), 'VIEW_OWN_EVENTS', 'View events user is part of or created', NOW(), NOW()),
(gen_random_uuid(), 'MANAGE_EVENT_USERS', 'Manage users in events', NOW(), NOW()),
(gen_random_uuid(), 'MANAGE_EVENT_BARRELS', 'Manage barrels in events', NOW(), NOW()),
(gen_random_uuid(), 'SET_EVENT_ACTIVE', 'Set event as active', NOW(), NOW()),
(gen_random_uuid(), 'END_EVENT', 'End an event', NOW(), NOW()),
(gen_random_uuid(), 'MANAGE_USERS', 'Manage all users', NOW(), NOW()),
(gen_random_uuid(), 'CREATE_USER', 'Create new users', NOW(), NOW()),
(gen_random_uuid(), 'UPDATE_USER', 'Update existing users', NOW(), NOW()),
(gen_random_uuid(), 'DELETE_USER', 'Delete users', NOW(), NOW()),
(gen_random_uuid(), 'VIEW_ALL_USERS', 'View all users in the system', NOW(), NOW()),
(gen_random_uuid(), 'MANAGE_PARTICIPANTS', 'Manage participants', NOW(), NOW()),
(gen_random_uuid(), 'CREATE_PARTICIPANT', 'Create new participants', NOW(), NOW()),
(gen_random_uuid(), 'UPDATE_PARTICIPANT', 'Update existing participants', NOW(), NOW()),
(gen_random_uuid(), 'DELETE_PARTICIPANT', 'Delete participants', NOW(), NOW()),
(gen_random_uuid(), 'MANAGE_BARRELS', 'Manage all barrels', NOW(), NOW()),
(gen_random_uuid(), 'CREATE_BARREL', 'Create new barrels', NOW(), NOW()),
(gen_random_uuid(), 'UPDATE_BARREL', 'Update existing barrels', NOW(), NOW()),
(gen_random_uuid(), 'DELETE_BARREL', 'Delete barrels', NOW(), NOW()),
(gen_random_uuid(), 'ADD_BEER', 'Add beer to events', NOW(), NOW()),
(gen_random_uuid(), 'REMOVE_BEER', 'Remove beer from events', NOW(), NOW()),
(gen_random_uuid(), 'VIEW_BEERS', 'View beer data', NOW(), NOW()),
(gen_random_uuid(), 'MANAGE_BEERS', 'Manage all beer data', NOW(), NOW()),
(gen_random_uuid(), 'VIEW_DASHBOARD', 'View dashboard', NOW(), NOW()),
(gen_random_uuid(), 'VIEW_SYSTEM_DASHBOARD', 'View system dashboard', NOW(), NOW()),
(gen_random_uuid(), 'MANAGE_SYSTEM', 'Manage system settings', NOW(), NOW()),
(gen_random_uuid(), 'VIEW_SYSTEM_STATS', 'View system statistics', NOW(), NOW()),
(gen_random_uuid(), 'MANAGE_BACKUPS', 'Manage system backups', NOW(), NOW()),
(gen_random_uuid(), 'VIEW_LEADERBOARD', 'View leaderboard', NOW(), NOW()),
(gen_random_uuid(), 'MANAGE_ACHIEVEMENTS', 'Manage achievements', NOW(), NOW()),
(gen_random_uuid(), 'VIEW_ACHIEVEMENTS', 'View achievements', NOW(), NOW());

-- Seed Role-Permission relationships for SUPER_ADMIN (all permissions)
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r.id, p.id
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r.name = 'SUPER_ADMIN';

-- Seed Role-Permission relationships for OPERATOR
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r.id, p.id
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r.name = 'OPERATOR'
AND p.name IN (
  'CREATE_EVENT', 'UPDATE_EVENT', 'DELETE_EVENT', 'VIEW_OWN_EVENTS',
  'MANAGE_EVENT_USERS', 'MANAGE_EVENT_BARRELS', 'SET_EVENT_ACTIVE', 'END_EVENT',
  'MANAGE_PARTICIPANTS', 'CREATE_PARTICIPANT', 'UPDATE_PARTICIPANT', 'DELETE_PARTICIPANT',
  'MANAGE_BARRELS', 'CREATE_BARREL', 'UPDATE_BARREL', 'DELETE_BARREL',
  'ADD_BEER', 'REMOVE_BEER', 'VIEW_BEERS', 'MANAGE_BEERS',
  'VIEW_DASHBOARD', 'VIEW_LEADERBOARD', 'VIEW_ACHIEVEMENTS'
);

-- Seed Role-Permission relationships for USER
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r.id, p.id
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r.name = 'USER'
AND p.name IN (
  'VIEW_OWN_EVENTS', 'ADD_BEER', 'VIEW_BEERS',
  'VIEW_DASHBOARD', 'VIEW_LEADERBOARD', 'VIEW_ACHIEVEMENTS'
);

-- PARTICIPANT has no permissions (empty set)
