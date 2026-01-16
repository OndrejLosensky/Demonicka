import { useState } from 'react';
import { Box, IconButton, Button } from '@demonicka/ui';
import { DarkMode as DarkModeIcon, LightMode as LightModeIcon, Notifications as NotificationsIcon, MenuIcon } from '@demonicka/ui';
import { useAppTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from './Logo';
import { ActiveEventDisplay } from './ActiveEventDisplay';
import { UserInfo } from './UserInfo';
import { MobileMenu } from './MobileMenu';
import { Link } from 'react-router-dom';
import translations from '../../locales/cs/common.header.json';

export function TopRow() {
  const { mode, toggleMode } = useAppTheme();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

        {/* Right: Theme, Notifications, Time/Event, User */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Theme Toggle */}
          <IconButton
            size="small"
            onClick={toggleMode}
            aria-label="Toggle theme"
            sx={{
              width: 36,
              height: 36,
              transition: 'all 0.2s ease-in-out',
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

          {/* Notifications (placeholder for future) */}
          <IconButton
            size="small"
            aria-label="Notifications"
            sx={{
              width: 36,
              height: 36,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-1px)',
              },
            }}
          >
            <NotificationsIcon fontSize="small" />
          </IconButton>

          {/* Active Event Display (Time + Event) */}
          <ActiveEventDisplay />

          {/* Mobile Menu Button */}
          {user && (
            <IconButton
              size="small"
              onClick={() => setMobileMenuOpen(true)}
              sx={{
                width: 36,
                height: 36,
                display: { xs: 'flex', md: 'none' },
                transition: 'all 0.2s ease-in-out',
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
            <Button
              component={Link}
              to="/login"
              variant="contained"
              size="small"
              sx={{
                px: 2,
                py: 1,
                textTransform: 'none',
                fontWeight: 500,
              }}
            >
              {translations.auth.login}
            </Button>
          )}
        </Box>
      </Box>
      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}
