import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types/user';
import { USER_ROLE } from '../../types/user';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin has access to everything
  if (user.role === USER_ROLE.ADMIN) {
    return <>{children}</>;
  }

  // Check if user's role is in the allowed roles
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
} 