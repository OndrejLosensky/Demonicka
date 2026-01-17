import { Link, useLocation } from 'react-router-dom';
import { Box } from '@demonicka/ui';
import {
  Speed as DashboardIcon,
  Group as PeopleIcon,
  Storage as StorageIcon,
  EmojiEvents as TrophyIcon,
  Event as EventIcon,
  TrendingUp as TrendingUpIcon,
  SportsBar as BeerPongIcon,
} from '@demonicka/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useActiveEvent } from '../../contexts/ActiveEventContext';
import { USER_ROLE } from '@demonicka/shared-types';
import translations from '../../locales/cs/common.header.json';
import { tokens } from '../../theme/tokens';

export function NavigationLinks() {
  const { user, hasRole } = useAuth();
  const { activeEvent } = useActiveEvent();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  const NavLink = ({
    to,
    icon,
    children,
  }: {
    to: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
  }) => {
    const active = isActive(to);
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
      {hasRole([USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]) && (
        <>
          <NavLink to="/dashboard" icon={<DashboardIcon sx={{ fontSize: 18 }} />}>
            {translations.navigation.dashboard}
          </NavLink>
          {activeEvent && (
            <>
              <NavLink
                to="/dashboard/participants"
                icon={<PeopleIcon sx={{ fontSize: 18 }} />}
              >
                {translations.navigation.participants}
              </NavLink>
              <NavLink to="/dashboard/barrels" icon={<StorageIcon sx={{ fontSize: 18 }} />}>
                {translations.navigation.barrels}
              </NavLink>
            </>
          )}
        </>
      )}
      {activeEvent && hasRole([USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]) && (
        <NavLink to="/leaderboard" icon={<TrophyIcon sx={{ fontSize: 18 }} />}>
          {translations.navigation.leaderboard}
        </NavLink>
      )}
      {hasRole([USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]) && (
        <>
          <NavLink to="/events" icon={<EventIcon sx={{ fontSize: 18 }} />}>
            {translations.navigation.events}
          </NavLink>
          {activeEvent && (
            <NavLink to="/dashboard/beer-pong" icon={<BeerPongIcon sx={{ fontSize: 18 }} />}>
              Beer Pong
            </NavLink>
          )}
        </>
      )}
      {user?.role === USER_ROLE.USER && (
        <>
          <NavLink to={`/${user?.id}/dashboard`} icon={<TrendingUpIcon sx={{ fontSize: 18 }} />}>
            Moje statistiky
          </NavLink>
          <NavLink to="/achievements" icon={<TrophyIcon sx={{ fontSize: 18 }} />}>
            Úspěchy
          </NavLink>
        </>
      )}
    </Box>
  );
}
