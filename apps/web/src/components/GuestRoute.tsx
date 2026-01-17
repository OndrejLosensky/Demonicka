import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLE } from '@demonicka/shared-types';

interface GuestRouteProps {
  children: React.ReactElement;
}

export default function GuestRoute({ children }: GuestRouteProps) {
  const { user, isLoading, hasRole } = useAuth();
  if (isLoading) return null;
  if (user) {
    if (hasRole([USER_ROLE.USER])) {
      return <Navigate to={`/${user.id}/dashboard`} replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }
  return children;
}