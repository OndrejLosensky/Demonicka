import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

export function LegacyUserSettingsRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={`/u/${encodeURIComponent(user.username)}/settings`} replace />;
}

