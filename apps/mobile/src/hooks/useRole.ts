import { useMemo } from 'react';
import { useAuthStore } from '../store/auth.store';
import { UserRole, Permission, roleHasPermission } from '@demonicka/shared';

export function useRole() {
  const user = useAuthStore((state) => state.user);

  const role = useMemo(() => {
    if (!user?.role) return null;
    return user.role as UserRole;
  }, [user?.role]);

  const hasPermission = useMemo(() => {
    return (permission: Permission): boolean => {
      if (!role) return false;
      return roleHasPermission(role, permission);
    };
  }, [role]);

  const isAdmin = useMemo(() => {
    return role === UserRole.SUPER_ADMIN;
  }, [role]);

  const isOperator = useMemo(() => {
    return role === UserRole.OPERATOR || role === UserRole.SUPER_ADMIN;
  }, [role]);

  const isUser = useMemo(() => {
    return role === UserRole.USER || isOperator;
  }, [role, isOperator]);

  return {
    role,
    hasPermission,
    isAdmin,
    isOperator,
    isUser,
  };
}
