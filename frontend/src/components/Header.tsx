import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../types/featureFlags';
import { USER_ROLE } from '../types/user';
import {
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Box,
  Typography,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { FaBook } from 'react-icons/fa';
import { format } from 'date-fns';
import translations from '../locales/cs/common.header.json';
import { useActiveEvent } from '../contexts/ActiveEventContext';

export default function Header() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const isHistoryEnabled = useFeatureFlag(FeatureFlagKey.HISTORY_PAGE);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { activeEvent } = useActiveEvent();

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
    if (hasRole([USER_ROLE.ADMIN, USER_ROLE.USER])) {
      navigate('/profile');
    } else {
      navigate('/');
    }
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
                    className="text-2xl font-bold text-primary flex items-center gap-2 relative"
                  >
                    <img
                      src="/logo.svg"
                      alt="Démonická"
                      className="h-8 w-auto"
                    />
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
                      className="absolute -right-2 -top-2 bg-primary text-white rounded-full px-2 py-1 text-xs font-semibold transform rotate-12 shadow-lg"
                    >
                      v2.0
                    </motion.div>
                  </Link>
                </motion.div>
                {user && (
                  <div className="ml-10 flex items-center space-x-4">
                    {hasRole([USER_ROLE.ADMIN]) && (
                      <>
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
                        {activeEvent && (
                          <>
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
                          </>
                        )}
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
                      </>
                    )}
                    {activeEvent && (
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
                    )}
                    {hasRole([USER_ROLE.ADMIN, USER_ROLE.USER]) && (
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
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center">
                {user ? (
                  <div className="flex items-center">
                    {activeEvent && (
                      <div className="mr-4">
                        <Typography variant="body2" className="text-text-secondary">
                          {format(new Date(currentTime), 'HH:mm:ss')}
                        </Typography>
                        <Typography variant="caption" className="text-text-secondary">
                          {activeEvent.name}
                        </Typography>
                      </div>
                    )}
                    <Tooltip title={translations.auth.profile}>
                      <IconButton
                        onClick={handleOpenMenu}
                        size="small"
                        sx={{ ml: 2 }}
                        aria-controls={anchorEl ? 'account-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={anchorEl ? 'true' : undefined}
                      >
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {user.username.charAt(0).toUpperCase()}
                        </Avatar>
                      </IconButton>
                    </Tooltip>
                    <Menu
                      anchorEl={anchorEl}
                      id="account-menu"
                      open={!!anchorEl}
                      onClose={handleCloseMenu}
                      onClick={handleCloseMenu}
                      aria-controls={anchorEl ? 'account-menu' : undefined}
                      aria-haspopup="true"
                      aria-expanded={anchorEl ? 'true' : undefined}
                      PaperProps={{
                        elevation: 0,
                        sx: {
                          overflow: 'visible',
                          filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                          mt: 1.5,
                          '& .MuiAvatar-root': {
                            width: 32,
                            height: 32,
                            ml: -0.5,
                            mr: 1,
                          },
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
                      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                      <MenuItem onClick={handleProfileClick} sx={{ py: 1.5 }}>
                        <ListItemIcon>
                          <PersonIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={translations.auth.profile}
                          primaryTypographyProps={{
                            className: "font-medium"
                          }}
                        />
                      </MenuItem>
                      {hasRole([USER_ROLE.ADMIN]) && (
                        <>
                          <MenuItem onClick={() => navigate('/dashboard/system')} sx={{ py: 1.5 }}>
                            <ListItemIcon>
                              <SettingsIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Systém"
                              primaryTypographyProps={{
                                className: "font-medium"
                              }}
                            />
                          </MenuItem>
                          <MenuItem onClick={() => navigate('/docs')} sx={{ py: 1.5 }}>
                            <ListItemIcon>
                              <FaBook className="text-lg" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Dokumentace"
                              primaryTypographyProps={{
                                className: "font-medium"
                              }}
                            />
                          </MenuItem>
                        </>
                      )}
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                </Box>
              </div>
            </div>
          </div>
        </motion.nav>
        <main className={`${isLandingPage ? '' : 'max-w-7xl mx-auto py-6 pt-20'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
} 