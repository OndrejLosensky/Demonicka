import { Permission } from './permissions.js';

/**
 * User roles in the Démonická application
 */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OPERATOR = 'OPERATOR',
  USER = 'USER',
  PARTICIPANT = 'PARTICIPANT',
}

/**
 * Type for role values
 */
export type RoleType = UserRole;

/**
 * Role-to-permission mappings
 * 
 * Each role has a set of permissions that define what actions
 * users with that role can perform.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // Super admin has all permissions
    ...Object.values(Permission),
  ],

  [UserRole.OPERATOR]: [
    // Event permissions (scoped to own events)
    Permission.CREATE_EVENT,
    Permission.UPDATE_EVENT,
    Permission.DELETE_EVENT,
    Permission.VIEW_OWN_EVENTS,
    Permission.MANAGE_EVENT_USERS,
    Permission.MANAGE_EVENT_BARRELS,
    Permission.SET_EVENT_ACTIVE,
    Permission.END_EVENT,

    // Participant management
    Permission.MANAGE_PARTICIPANTS,
    Permission.CREATE_PARTICIPANT,
    Permission.UPDATE_PARTICIPANT,
    Permission.DELETE_PARTICIPANT,

    // Barrel management
    Permission.MANAGE_BARRELS,
    Permission.CREATE_BARREL,
    Permission.UPDATE_BARREL,
    Permission.DELETE_BARREL,

    // Beer management
    Permission.ADD_BEER,
    Permission.REMOVE_BEER,
    Permission.VIEW_BEERS,
    Permission.MANAGE_BEERS,

    // Dashboard (operator's own dashboard)
    Permission.VIEW_DASHBOARD,

    // Leaderboard
    Permission.VIEW_LEADERBOARD,

    // Achievements
    Permission.VIEW_ACHIEVEMENTS,
  ],

  [UserRole.USER]: [
    // User can view events they're part of
    Permission.VIEW_OWN_EVENTS,

    // Beer permissions
    Permission.ADD_BEER,
    Permission.VIEW_BEERS,

    // Dashboard
    Permission.VIEW_DASHBOARD,

    // Leaderboard
    Permission.VIEW_LEADERBOARD,

    // Achievements
    Permission.VIEW_ACHIEVEMENTS,
  ],

  [UserRole.PARTICIPANT]: [
    // Participants have no permissions (token-based only)
    // They can only be added to events and have beers added for them
  ],
};

/**
 * Get all permissions for a given role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission);
}

/**
 * Check if a role can login
 * PARTICIPANT cannot login, all other roles can
 */
export function canRoleLogin(role: UserRole): boolean {
  return role !== UserRole.PARTICIPANT;
}

/**
 * Check if a role can create events
 */
export function canRoleCreateEvents(role: UserRole): boolean {
  return roleHasPermission(role, Permission.CREATE_EVENT);
}

/**
 * Check if a role can see all events (not just own)
 */
export function canRoleViewAllEvents(role: UserRole): boolean {
  return roleHasPermission(role, Permission.VIEW_ALL_EVENTS);
}
