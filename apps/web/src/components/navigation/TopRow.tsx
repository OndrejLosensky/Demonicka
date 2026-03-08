import { useState } from 'react';
import { Box, IconButton, Button } from '@demonicka/ui';
import { DarkMode as DarkModeIcon, LightMode as LightModeIcon, Notifications as NotificationsIcon, MenuIcon } from '@demonicka/ui';
import { Badge } from '@mui/material';
import { useAppTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from './Logo';
import { ActiveEventDisplay } from './ActiveEventDisplay';
import { UserInfo } from './UserInfo';
import { MobileMenu } from './MobileMenu';
import { NotificationMenu } from './NotificationMenu';
import { Link } from 'react-router-dom';
import { useTranslations } from '../../contexts/LocaleContext';
import { tokens } from '../../theme/tokens';
import { useNotifications } from '../../hooks/useNotifications';

export function TopRow() {
  const { mode, toggleMode } = useAppTheme();
  const { user } = useAuth();
  const headerT = useTranslations<{ auth: { login: string } }>('common.header');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const { unreadCount } = useNotifications();

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 48,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Left: Logo */}
        <Logo />

        {/* Right: Time/Event, Theme, Notifications, User */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Active Event Display (Time + Event) */}
          <ActiveEventDisplay />

          {/* Theme Toggle */}
          <IconButton
            size="small"
            onClick={toggleMode}
            aria-label="Toggle theme"
            sx={{
              width: 36,
              height: 36,
              transition: tokens.transitions.default,
              '&:hover': {
                transform: 'translateY(-1px)',
              },
            }}
          >
            {mode === 'light' ? (
              <DarkModeIcon fontSize="small" />
            ) : (
              <LightModeIcon fontSize="small" />
            )}
          </IconButton>

          {/* Notifications */}
          {user && (
            <IconButton
              size="small"
              aria-label="Notifications"
              onClick={(e) => setNotificationAnchor(e.currentTarget)}
              sx={{
                width: 36,
                height: 36,
                transition: tokens.transitions.default,
                '&:hover': {
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <Badge
                badgeContent={unreadCount}
                color="primary"
                max={99}
                invisible={unreadCount === 0}
              >
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton>
          )}

          {/* Mobile Menu Button */}
          {user && (
            <IconButton
              size="small"
              onClick={() => setMobileMenuOpen(true)}
              sx={{
                width: 36,
                height: 36,
                display: { xs: 'flex', md: 'none' },
                transition: tokens.transitions.default,
                '&:hover': {
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
          )}

          {/* User Info */}
          {user ? (
            <UserInfo />
          ) : (
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button
                variant="contained"
                size="small"
                sx={{
                  px: 2,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                {headerT.auth?.login ?? 'Log in'}
              </Button>
            </Link>
          )}
        </Box>
      </Box>
      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <NotificationMenu
        anchorEl={notificationAnchor}
        onClose={() => setNotificationAnchor(null)}
      />
    </>
  );
}
