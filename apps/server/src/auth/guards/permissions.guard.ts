import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '@demonicka/shared';
import { UserRole as PrismaUserRole, User } from '@prisma/client';
import { getPermissionsForRole, roleHasPermission, UserRole as SharedUserRole } from '@demonicka/shared';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // SUPER_ADMIN has access to everything
    const userRole = user.role as string;
    if (userRole === 'SUPER_ADMIN') {
      return true;
    }

    // Check if user has any of the required permissions
    const userPermissions = getPermissionsForRole(userRole as SharedUserRole);
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `User does not have required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}

/**
 * Helper function to check if a user has a specific permission
 */
export function userHasPermission(user: User, permission: Permission): boolean {
  const userRole = user.role as string;
  if (userRole === 'SUPER_ADMIN') {
    return true;
  }

  return roleHasPermission(userRole as SharedUserRole, permission);
}

/**
 * Helper function to check if a user can access an event
 * OPERATOR can only see events they created or are part of
 */
export function userCanAccessEvent(
  user: User,
  event: { createdBy?: string | null; users?: { userId: string }[] },
): boolean {
  const userRole = user.role as string;
  // SUPER_ADMIN can access all events
  if (userRole === 'SUPER_ADMIN') {
    return true;
  }

  // OPERATOR can access events they created or are part of
  if (userRole === 'OPERATOR') {
    const isCreator = event.createdBy === user.id;
    const isParticipant =
      event.users?.some((eu) => eu.userId === user.id) ?? false;
    return isCreator || isParticipant;
  }

  // USER and PARTICIPANT can only access events they're part of
  return event.users?.some((eu) => eu.userId === user.id) ?? false;
}

// Type guard to check if role is valid after migration
function isValidRole(role: string): role is SharedUserRole {
  return ['SUPER_ADMIN', 'OPERATOR', 'USER', 'PARTICIPANT'].includes(role);
}
