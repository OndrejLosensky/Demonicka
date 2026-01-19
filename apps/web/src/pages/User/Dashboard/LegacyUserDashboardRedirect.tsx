import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageLoader } from '@demonicka/ui';
import { useAuth } from '../../../contexts/AuthContext';
import { USER_ROLE } from '@demonicka/shared-types';
import { userService } from '../../../services/userService';

export function LegacyUserDashboardRedirect() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fallback = `/u/${encodeURIComponent(user.username)}/dashboard`;

    // Self: always redirect to own dashboard
    if (!userId || userId === user.id) {
      navigate(fallback, { replace: true });
      return;
    }

    // Admin/operator: allow redirecting to other users (resolve username)
    if (user.role === USER_ROLE.SUPER_ADMIN || user.role === USER_ROLE.OPERATOR) {
      void (async () => {
        try {
          const target = await userService.getUser(userId);
          navigate(`/u/${encodeURIComponent(target.username)}/dashboard`, { replace: true });
        } catch {
          navigate(fallback, { replace: true });
        }
      })();
      return;
    }

    // Non-admin: never view other users → redirect to own
    navigate(fallback, { replace: true });
  }, [navigate, user, userId]);

  return <PageLoader message="Přesměrování..." />;
}

