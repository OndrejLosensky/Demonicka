import { Link, useLocation } from 'react-router-dom';
import { Box, Typography } from '@demonicka/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useActiveEvent } from '../../contexts/ActiveEventContext';
import { USER_ROLE } from '@demonicka/shared-types';
import translations from '../../locales/cs/common.header.json';

export function NavigationLinks() {
  const { user, hasRole } = useAuth();
  const { activeEvent } = useActiveEvent();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
    const active = isActive(to);
    return (
      <Box
        component={Link}
        to={to}
        sx={{
          position: 'relative',
          px: 2,
          py: 1.5,
          textDecoration: 'none',
          color: active ? 'primary.main' : 'text.primary',
          fontWeight: active ? 600 : 500,
          fontSize: '0.875rem',
          transition: 'all 0.2s ease-in-out',
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
            transition: 'all 0.2s ease-in-out',
          },
        }}
      >
        {children}
      </Box>
    );
  };

  return (
    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
      {hasRole([USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]) && (
        <>
          <NavLink to="/dashboard">{translations.navigation.dashboard}</NavLink>
          {activeEvent && (
            <>
              <NavLink to="/dashboard/participants">
                {translations.navigation.participants}
              </NavLink>
              <NavLink to="/dashboard/barrels">{translations.navigation.barrels}</NavLink>
            </>
          )}
        </>
      )}
      {activeEvent && hasRole([USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]) && (
        <NavLink to="/leaderboard">{translations.navigation.leaderboard}</NavLink>
      )}
      {hasRole([USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]) && (
        <NavLink to="/events">{translations.navigation.events}</NavLink>
      )}
      {user?.role === USER_ROLE.USER && (
        <>
          <NavLink to={`/${user?.id}/dashboard`}>Moje statistiky</NavLink>
          <NavLink to="/achievements">Úspěchy</NavLink>
        </>
      )}
    </Box>
  );
}
