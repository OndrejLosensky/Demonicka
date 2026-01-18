import { useNavigate, useLocation } from 'react-router-dom';
import { Drawer, Box, Typography, List, ListItem, ListItemButton, ListItemText, Chip } from '@demonicka/ui';
import { Event as EventIcon, AccessTime as AccessTimeIcon } from '@demonicka/ui';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useActiveEvent } from '../../contexts/ActiveEventContext';
import { USER_ROLE } from '@demonicka/shared-types';
import translations from '../../locales/cs/common.header.json';
import { tokens } from '../../theme/tokens';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const { user, hasRole } = useAuth();
  const { activeEvent } = useActiveEvent();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const includeSubRoutes = new Set<string>(['/events', '/dashboard/system', '/dashboard/beer-pong']);
  const isActive = (path: string) => {
    if (includeSubRoutes.has(path)) {
      return location.pathname === path || location.pathname.startsWith(`${path}/`);
    }
    return location.pathname === path;
  };

  const getNavigationItems = () => {
    if (!user) return [];

    const items = [];

    if (hasRole([USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR])) {
      items.push(
        { to: '/dashboard', label: translations.navigation.dashboard },
        { to: '/events', label: translations.navigation.events }
      );

      if (activeEvent) {
        items.push(
          { to: '/dashboard/participants', label: translations.navigation.participants },
          { to: '/dashboard/barrels', label: translations.navigation.barrels },
          { to: '/leaderboard', label: translations.navigation.leaderboard }
        );
      }

      if (user.role === USER_ROLE.SUPER_ADMIN) {
        items.push(
          { to: '/dashboard/system', label: 'Systém' },
          { to: '/dashboard/docs', label: 'Dokumentace' },
          { to: '/activity', label: 'Aktivita' }
        );
      }
    }

    if (user?.role === USER_ROLE.USER) {
      items.push(
        { to: `/${user?.id}/dashboard`, label: 'Moje statistiky' },
        { to: '/achievements', label: 'Úspěchy' }
      );
    }

    return items;
  };

  const handleItemClick = (to: string) => {
    navigate(to);
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 280,
          bgcolor: 'background.paper',
          borderLeft: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Navigace
        </Typography>

        <List>
          {getNavigationItems().map((item) => (
            <ListItem key={item.to} disablePadding>
              <ListItemButton
                onClick={() => handleItemClick(item.to)}
                sx={{
                  borderRadius: tokens.borderRadius.xs,
                  mb: 0.5,
                  bgcolor: isActive(item.to) ? 'primary.main' : 'transparent',
                  color: isActive(item.to) ? 'primary.contrastText' : 'text.primary',
                  '&:hover': {
                    bgcolor: isActive(item.to) ? 'primary.dark' : 'action.hover',
                  },
                }}
              >
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    sx: { fontWeight: 500 },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {activeEvent && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: tokens.borderRadius.md }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Aktivní událost
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <EventIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Chip
                label={activeEvent.name}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {format(currentTime, 'HH:mm:ss')}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
