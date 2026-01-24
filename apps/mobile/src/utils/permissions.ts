import { UserRole, Permission, roleHasPermission, getPermissionsForRole } from '@demonicka/shared';
import type { User } from '@demonicka/shared-types';

/**
 * Check if a user has access to a specific feature
 */
export function canAccess(
  feature: 'dashboard' | 'participants' | 'barrels' | 'event' | 'beerPong' | 'system' | 'users' | 'settings',
  user: User | null
): boolean {
  if (!user?.role) return false;

  const role = user.role as UserRole;

  switch (feature) {
    case 'dashboard':
      return roleHasPermission(role, Permission.VIEW_DASHBOARD);

    case 'participants':
      return roleHasPermission(role, Permission.MANAGE_PARTICIPANTS) || 
             roleHasPermission(role, Permission.VIEW_ALL_USERS);

    case 'barrels':
      return roleHasPermission(role, Permission.MANAGE_BARRELS);

    case 'event':
      return roleHasPermission(role, Permission.VIEW_OWN_EVENTS);

    case 'beerPong':
      return roleHasPermission(role, Permission.CREATE_BEER_PONG_EVENT) ||
             roleHasPermission(role, Permission.VIEW_OWN_EVENTS);

    case 'system':
    case 'settings':
      return roleHasPermission(role, Permission.MANAGE_SYSTEM) ||
             role === UserRole.SUPER_ADMIN;

    case 'users':
      return roleHasPermission(role, Permission.MANAGE_USERS) ||
             role === UserRole.SUPER_ADMIN;

    default:
      return false;
  }
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user?.role) return false;
  return roleHasPermission(user.role as UserRole, permission);
}

/**
 * Get all permissions for a user
 */
export function getUserPermissions(user: User | null): Permission[] {
  if (!user?.role) return [];
  return getPermissionsForRole(user.role as UserRole);
}
