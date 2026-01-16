import { UserRole } from './roles.js';
import { Permission } from './permissions.js';

/**
 * User with permissions resolved
 */
export interface UserWithPermissions {
  id: string;
  role: UserRole;
  permissions: Permission[];
  canLogin: boolean;
  createdBy?: string | null;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Event ownership check context
 */
export interface EventOwnershipContext {
  userId: string;
  eventId: string;
  eventCreatedBy?: string | null;
  userInEventUsers?: boolean;
}
