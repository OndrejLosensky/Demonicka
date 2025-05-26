import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../types/featureFlags';
import {
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Box,
  Fade,
  Typography,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import translations from '../locales/cs/common.header.json';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const isHistoryEnabled = useFeatureFlag(FeatureFlagKey.HISTORY_PAGE);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    handleCloseMenu();
    logout();
    navigate('/login');
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleCloseMenu();
    navigate('/profile');
  };

  const isActive = (path: string) => location.pathname === path;
  const isLandingPage = location.pathname === '/';

  return (
    <div>
      <div className={`min-h-screen ${isLandingPage ? '' : 'bg-background-secondary'}`}>
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className={`fixed w-full z-50 transition-all duration-300 ${
            isScrolled || !isLandingPage
              ? 'bg-background-primary/95 backdrop-blur-sm shadow-sm'
              : 'bg-background-secondary/80 backdrop-blur-sm'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="shrink-0 flex items-center"
                >
                  <Link
                    to="/"
                    className="text-2xl font-bold text-primary"
                  >
                    {translations.brand}
                  </Link>
                </motion.div>
                {user && (
                  <div className="ml-10 flex items-center space-x-4">
                    <Link
                      to="/dashboard"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/dashboard')
                          ? 'bg-primary text-white'
                          : 'text-text-primary hover:text-text-secondary'
                      }`}
                    >
                      {translations.navigation.dashboard}
                    </Link>
                    <Link
                      to="/dashboard/ucastnici"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/dashboard/ucastnici')
                          ? 'bg-primary text-white'
                          : 'text-text-primary hover:text-text-secondary'
                      }`}
                    >
                      {translations.navigation.participants}
                    </Link>
                    <Link
                      to="/dashboard/barrels"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/dashboard/barrels')
                          ? 'bg-primary text-white'
                          : 'text-text-primary hover:text-text-secondary'
                      }`}
                    >
                      {translations.navigation.barrels}
                    </Link>
                    {isHistoryEnabled && (
                      <Link
                        to="/dashboard/history"
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          isActive('/dashboard/history')
                            ? 'bg-primary text-white'
                            : 'text-text-primary hover:text-text-secondary'
                        }`}
                      >
                        {translations.navigation.history}
                      </Link>
                    )}
                    <Link
                      to="/leaderboard"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/leaderboard')
                          ? 'bg-primary text-white'
                          : 'text-text-primary hover:text-text-secondary'
                      }`}
                    >
                      {translations.navigation.leaderboard}
                    </Link>
                    <Link
                      to="/events"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/events')
                          ? 'bg-primary text-white'
                          : 'text-text-primary hover:text-text-secondary'
                      }`}
                    >
                      {translations.navigation.events}
                    </Link>
                  </div>
                )}
              </div>
              <div className="flex items-center">
                {user ? (
                  <div className="flex items-center space-x-6">
                    <Typography variant="body2" className="text-text-secondary font-medium min-w-[48px] text-center">
                      {format(currentTime, 'HH:mm')}
                    </Typography>
                    <Tooltip 
                      title={translations.auth.accountSettings}
                      TransitionComponent={Fade}
                      arrow
                    >
                      <IconButton
                        onClick={handleOpenMenu}
                        size="small"
                        className="relative"
                        sx={{
                          padding: '3px',
                          '&:hover': {
                            backgroundColor: 'transparent',
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            bgcolor: 'primary.main',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            transition: 'transform 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.05)',
                            },
                          }}
                        >
                          {user.username[0].toUpperCase()}
                        </Avatar>
                      </IconButton>
                    </Tooltip>
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={handleCloseMenu}
                      onClick={handleCloseMenu}
                      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                      PaperProps={{
                        elevation: 4,
                        sx: {
                          mt: 1.5,
                          minWidth: 180,
                          overflow: 'visible',
                          filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                          '&:before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: 'background.paper',
                            transform: 'translateY(-50%) rotate(45deg)',
                            zIndex: 0,
                          },
                        },
                      }}
                    >
                      <Box className="px-3 py-2 border-b border-gray-100">
                        <Typography className="text-sm font-medium text-text-primary">
                          {user.username}
                        </Typography>
                      </Box>
                      <MenuItem 
                        onClick={handleProfileClick}
                        className="hover:bg-primary/5"
                        sx={{ py: 1.5 }}
                      >
                        <ListItemIcon>
                          <PersonIcon fontSize="small" className="text-primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={translations.auth.profile}
                          primaryTypographyProps={{
                            className: "font-medium"
                          }}
                        />
                      </MenuItem>
                      <MenuItem 
                        onClick={handleLogout} 
                        className="hover:bg-red-50 text-red-600"
                        sx={{ py: 1.5 }}
                      >
                        <ListItemIcon>
                          <LogoutIcon fontSize="small" className="text-red-600" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={translations.auth.logout}
                          primaryTypographyProps={{
                            className: "font-medium text-red-600"
                          }}
                        />
                      </MenuItem>
                    </Menu>
                  </div>
                ) : (
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Link
                      to="/login"
                      className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary-hover"
                    >
                      {translations.auth.login}
                    </Link>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.nav>
        <main className={`${isLandingPage ? '' : 'max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-20'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
} 