import { Link, useLocation } from 'react-router-dom';
import { Box } from '@demonicka/ui';
import { useEffect, useMemo, useState } from 'react';
import {
  Speed as DashboardIcon,
  Group as PeopleIcon,
  Storage as StorageIcon,
  EmojiEvents as TrophyIcon,
  Event as EventIcon,
  TrendingUp as TrendingUpIcon,
  SportsBar as BeerPongIcon,
  Settings as SettingsIcon,
} from '@demonicka/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useActiveEvent } from '../../contexts/ActiveEventContext';
import { USER_ROLE, type Event, type BeerPongEvent } from '@demonicka/shared-types';
import translations from '../../locales/cs/common.header.json';
import { tokens } from '../../theme/tokens';
import { eventService } from '../../services/eventService';
import { beerPongService } from '../../services/beerPongService';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export function NavigationLinks() {
  const { user, hasRole } = useAuth();
  const { activeEvent } = useActiveEvent();
  const location = useLocation();

  const canSeeAdminNav =
    Boolean(user) && hasRole([USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]);

  const isActive = (path: string, options?: { includeSubRoutes?: boolean }) => {
    if (options?.includeSubRoutes) {
      return location.pathname === path || location.pathname.startsWith(`${path}/`);
    }
    return location.pathname === path;
  };

  const getLinkSx = (active: boolean) => ({
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
  });

  const [events, setEvents] = useState<Event[]>([]);
  useEffect(() => {
    if (!canSeeAdminNav) return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await eventService.getAllEvents();
        if (!cancelled) setEvents(data);
      } catch (err) {
        console.error('[NavigationLinks] Failed to load events:', err);
        if (!cancelled) setEvents([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canSeeAdminNav]);

  const [beerPongTournaments, setBeerPongTournaments] = useState<BeerPongEvent[]>([]);
  useEffect(() => {
    if (!canSeeAdminNav || !activeEvent) {
      setBeerPongTournaments([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await beerPongService.getByEvent(activeEvent.id);
        if (!cancelled) setBeerPongTournaments(data);
      } catch (err) {
        console.error('[NavigationLinks] Failed to load beer pong tournaments:', err);
        if (!cancelled) setBeerPongTournaments([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canSeeAdminNav, activeEvent]);

  const eventItems = useMemo(() => {
    const sorted = [...events].sort((a, b) => {
      const aIsActive = a.id === activeEvent?.id || a.isActive;
      const bIsActive = b.id === activeEvent?.id || b.isActive;
      if (aIsActive !== bIsActive) return aIsActive ? -1 : 1;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
    return sorted.map((e) => ({ key: e.id, label: e.name, to: `/dashboard/events/${e.id}` }));
  }, [events, activeEvent?.id]);

  const beerPongItems = useMemo(
    () =>
      beerPongTournaments.map((t) => ({
        key: t.id,
        label: t.name,
        to: `/dashboard/beer-pong/${t.id}`,
      })),
    [beerPongTournaments]
  );

  const dashboardItems = useMemo(
    () => {
      if (!user) return [];
      const userBase = `/u/${encodeURIComponent(user.username)}`;
      return [
        {
          key: 'my-overview',
          label: 'Můj přehled',
          to: `${userBase}/dashboard`,
        },
      ];
    },
    [user]
  );

  const NavLink = ({
    to,
    icon,
    children,
  }: {
    to: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
  }) => {
    const active = isActive(to, {
      includeSubRoutes:
        to === '/dashboard' ||
        to === '/dashboard/events' ||
        to === '/dashboard/beer-pong' ||
        to.endsWith('/dashboard') ||
        to.endsWith('/dashboard/events') ||
        to.endsWith('/dashboard/beer-pong'),
    });
    return (
      <Box
        component={Link}
        to={to}
        sx={getLinkSx(active)}
      >
        {icon}
        {children}
      </Box>
    );
  };

  const DropdownNavLink = ({
    to,
    icon,
    children,
    items,
  }: {
    to: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    items: Array<{ key: string; label: string; to: string }>;
  }) => {
    const [open, setOpen] = useState(false);
    const hasItems = items.length > 0;
    const active = isActive(to, {
      includeSubRoutes:
        to === '/dashboard' ||
        to === '/dashboard/events' ||
        to === '/dashboard/beer-pong' ||
        to.endsWith('/dashboard') ||
        to.endsWith('/dashboard/events') ||
        to.endsWith('/dashboard/beer-pong'),
    });

    return (
      <Box
        onMouseEnter={() => {
          if (hasItems) setOpen(true);
        }}
        onMouseLeave={() => setOpen(false)}
        sx={{ position: 'relative' }}
      >
        <Box component={Link} to={to} sx={getLinkSx(active)}>
          {icon}
          {children}
          {hasItems && (
            <KeyboardArrowDownIcon
              sx={{
                ml: -0.25,
                fontSize: 18,
                color: 'inherit',
                transition: tokens.transitions.default,
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          )}
        </Box>

        {open && hasItems && (
          <Box
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              minWidth: 240,
              maxHeight: 360,
              overflowY: 'auto',
              borderRadius: 1,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: tokens.shadows.xs,
              zIndex: tokens.zIndex.header + 1,
              py: 0.5,
              transform: 'translateY(8px)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -8,
                left: 0,
                right: 0,
                height: 8,
              },
            }}
          >
            {items.map((item) => (
              <Box
                key={item.key}
                component={Link}
                to={item.to}
                onClick={() => setOpen(false)}
                sx={{
                  display: 'block',
                  px: 2,
                  py: 1,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  color: 'text.primary',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    color: 'primary.main',
                  },
                }}
              >
                {item.label}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  if (!user) return null;

  const userBase = `/u/${encodeURIComponent(user.username)}`;

  return (
    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
      {canSeeAdminNav && (
        <>
          <DropdownNavLink to="/dashboard" icon={<DashboardIcon sx={{ fontSize: 18 }} />} items={dashboardItems}>
            {translations.navigation.dashboard}
          </DropdownNavLink>
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
      {activeEvent && canSeeAdminNav && (
        <NavLink to="/dashboard/leaderboard" icon={<TrophyIcon sx={{ fontSize: 18 }} />}>
          {translations.navigation.leaderboard}
        </NavLink>
      )}
      {canSeeAdminNav && (
        <>
          <DropdownNavLink to="/dashboard/events" icon={<EventIcon sx={{ fontSize: 18 }} />} items={eventItems}>
            {translations.navigation.events}
          </DropdownNavLink>
          {activeEvent && (
            <DropdownNavLink
              to="/dashboard/beer-pong"
              icon={<BeerPongIcon sx={{ fontSize: 18 }} />}
              items={beerPongItems}
            >
              Beer Pong
            </DropdownNavLink>
          )}
        </>
      )}
      {user?.role === USER_ROLE.USER && (
        <>
          <NavLink to={`${userBase}/dashboard`} icon={<TrendingUpIcon sx={{ fontSize: 18 }} />}>
            Moje statistiky
          </NavLink>
          <NavLink to={`${userBase}/dashboard/events`} icon={<EventIcon sx={{ fontSize: 18 }} />}>
            Události
          </NavLink>
          <NavLink
            to={`${userBase}/settings`}
            icon={<SettingsIcon sx={{ fontSize: 18 }} />}
          >
            Nastavení
          </NavLink>
          <NavLink to={`${userBase}/achievements`} icon={<TrophyIcon sx={{ fontSize: 18 }} />}>
            Úspěchy
          </NavLink>
        </>
      )}
    </Box>
  );
}
