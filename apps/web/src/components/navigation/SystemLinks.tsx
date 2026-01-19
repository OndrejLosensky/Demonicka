import { Link, useLocation } from 'react-router-dom';
import { Box } from '@demonicka/ui';
import { Settings as SettingsIcon, History as HistoryIcon } from '@demonicka/ui';
import { FaBook } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLE } from '@demonicka/shared-types';
import { tokens } from '../../theme/tokens';

export function SystemLinks() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || user.role !== USER_ROLE.SUPER_ADMIN) return null;

  const isActive = (path: string, options?: { includeSubRoutes?: boolean }) => {
    if (options?.includeSubRoutes) {
      return location.pathname === path || location.pathname.startsWith(`${path}/`);
    }
    return location.pathname === path;
  };

  const SystemLink = ({
    to,
    icon,
    children,
  }: {
    to: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }) => {
    const active = isActive(to, { includeSubRoutes: to === '/dashboard/system' });
    return (
      <Box
        component={Link}
        to={to}
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1.5,
          textDecoration: 'none',
          color: active ? 'primary.main' : 'text.primary',
          fontWeight: active ? 600 : 500,
          fontSize: '0.875rem',
          transition: tokens.transitions.default,
          '&:hover': {
            color: 'primary.main',
            '&::after': {
              opacity: 1,
              transform: 'scaleX(1)',
            },
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -3,
            left: 0,
            right: 0,
            height: 2,
            bgcolor: 'primary.main',
            opacity: active ? 1 : 0,
            transform: active ? 'scaleX(1)' : 'scaleX(0)',
            transformOrigin: 'center',
            transition: tokens.transitions.default,
          },
        }}
      >
        {icon}
        {children}
      </Box>
    );
  };

  return (
    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
      <SystemLink to="/dashboard/system" icon={<SettingsIcon sx={{ fontSize: 18 }} />}>
        Systém
      </SystemLink>
      <SystemLink to="/dashboard/docs" icon={<FaBook className="text-base" />}>
        Dokumentace
      </SystemLink>
      <SystemLink to="/dashboard/activity" icon={<HistoryIcon sx={{ fontSize: 18 }} />}>
        Aktivita
      </SystemLink>
    </Box>
  );
}
