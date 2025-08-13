import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
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
  Chip,
  Divider,
  Badge,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  AccessTime as AccessTimeIcon,
  Event as EventIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { FaBook } from 'react-icons/fa';
import { format } from 'date-fns';
import translations from '../locales/cs/common.header.json';
import { useActiveEvent } from '../contexts/ActiveEventContext';
import { useAppTheme } from '../contexts/ThemeContext';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

export default function Header() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { activeEvent } = useActiveEvent();
  const { mode, toggleMode } = useAppTheme();

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
              ? 'bg-background-primary/95 backdrop-blur-sm shadow-lg border-b border-border-secondary/30'
              : 'bg-background-primary/80 backdrop-blur-md shadow-md border-b border-border-secondary/20'
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
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                            isActive('/dashboard')
                              ? 'bg-primary text-white shadow-md'
                              : 'text-text-primary hover:text-text-secondary hover:bg-background-secondary/50'
                          }`}
                        >
                          {translations.navigation.dashboard}
                        </Link>
                        {activeEvent && (
                          <>
                            <Link
                              to="/dashboard/participants"
                              className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                isActive('/dashboard/participants')
                                  ? 'bg-primary text-white shadow-md'
                                  : 'text-text-primary hover:text-text-secondary hover:bg-background-secondary/50'
                              }`}
                            >
                              {translations.navigation.participants}
                            </Link>
                            {hasRole([USER_ROLE.ADMIN]) && (
                              <Link
                                to="/dashboard/barrels"
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                  isActive('/dashboard/barrels')
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-text-primary hover:text-text-secondary hover:bg-background-secondary/50'
                                }`}
                              >
                                {translations.navigation.barrels}
                              </Link>
                            )}
                          </>
                        )}
                      </>
                    )}
                    {activeEvent && hasRole([USER_ROLE.ADMIN]) && (
                      <Link
                        to="/leaderboard"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          isActive('/leaderboard')
                            ? 'bg-primary text-white shadow-md'
                            : 'text-text-primary hover:text-text-secondary hover:bg-background-secondary/50'
                        }`}
                      >
                        {translations.navigation.leaderboard}
                      </Link>
                    )}
                    {hasRole([USER_ROLE.ADMIN]) && (
                      <Link
                        to="/events"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          isActive('/events')
                            ? 'bg-primary text-white shadow-md'
                            : 'text-text-primary hover:text-text-secondary hover:bg-background-secondary/50'
                        }`}
                      >
                        {translations.navigation.events}
                      </Link>
                    )}
                    {user?.role === USER_ROLE.USER && (
                      <Link
                        to={`/${user?.id}/dashboard`}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          isActive(`/${user?.id}/dashboard`)
                            ? 'bg-primary text-white shadow-md'
                            : 'text-text-primary hover:text-text-secondary hover:bg-background-secondary/50'
                        }`}
                      >
                        Moje statistiky
                      </Link>
                    )}
                    {user?.role === USER_ROLE.USER && (
                      <Link
                        to="/achievements"
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          isActive('/achievements')
                            ? 'bg-primary text-white shadow-md'
                            : 'text-text-primary hover:text-text-secondary hover:bg-background-secondary/50'
                        }`}
                      >
                        Úspěchy
                      </Link>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center">
                {user ? (
                  <div className="flex items-center space-x-3">
                    <IconButton
                      size="small"
                      onClick={toggleMode}
                      aria-label="Toggle theme"
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      {mode === 'light' ? (
                        <DarkModeIcon fontSize="small" />
                      ) : (
                        <LightModeIcon fontSize="small" />
                      )}
                    </IconButton>
                    {activeEvent && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center bg-background-secondary/60 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-border-secondary/30"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1.5">
                            <AccessTimeIcon className="text-text-secondary" fontSize="small" />
                            <Typography 
                              variant="body2" 
                              className="text-text-primary font-mono font-medium"
                              sx={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {format(new Date(currentTime), 'HH:mm:ss')}
                            </Typography>
                          </div>
                          <div className="w-px h-4 bg-border-secondary/50" />
                          <div className="flex items-center space-x-1.5">
                            <EventIcon className="text-text-secondary" fontSize="small" />
                            <Chip
                              label={activeEvent.name}
                              size="small"
                              className="bg-primary/10 text-primary border-primary/20"
                              sx={{
                                '& .MuiChip-label': {
                                  fontSize: '0.7rem',
                                  fontWeight: 500,
                                  px: 1,
                                },
                                height: 20,
                                borderRadius: '10px',
                              }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Notification Bell */}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Tooltip title="Notifikace" arrow placement="bottom">
                        <IconButton
                          size="small"
                          className="bg-background-secondary/50 hover:bg-background-secondary/70 border border-border-secondary/30"
                          sx={{ 
                            width: 36, 
                            height: 36,
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            }
                          }}
                        >
                          <Badge badgeContent={0} color="primary" max={99}>
                            <NotificationsIcon className="text-text-secondary" fontSize="small" />
                          </Badge>
                        </IconButton>
                      </Tooltip>
                    </motion.div>

                    {/* User Profile */}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Tooltip 
                        title={`${translations.auth.profile} - ${user.username}`}
                        arrow
                        placement="bottom"
                      >
                        <IconButton
                          onClick={handleOpenMenu}
                          size="medium"
                          className="bg-gradient-to-br from-primary/15 to-primary/5 hover:from-primary/25 hover:to-primary/10 border border-primary/30 shadow-sm"
                          sx={{ 
                            width: 40, 
                            height: 40,
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                            }
                          }}
                          aria-controls={anchorEl ? 'account-menu' : undefined}
                          aria-haspopup="true"
                          aria-expanded={anchorEl ? 'true' : undefined}
                        >
                          <Avatar 
                            sx={{ 
                              width: 28, 
                              height: 28,
                              bgcolor: 'primary.main',
                              fontWeight: 700,
                              fontSize: '0.875rem',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            }}
                          >
                            {user.username.charAt(0).toUpperCase()}
                          </Avatar>
                        </IconButton>
                      </Tooltip>
                    </motion.div>
                    
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
                        elevation: 8,
                        sx: {
                          overflow: 'visible',
                          filter: 'drop-shadow(0px 8px 24px rgba(0,0,0,0.12))',
                          mt: 1.5,
                          minWidth: 180,
                          borderRadius: 2,
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
                            boxShadow: '0px -2px 4px rgba(0,0,0,0.06)',
                          },
                        },
                      }}
                      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                      <Box sx={{ px: 2, py: 1.5 }}>
                        <Typography variant="subtitle2" className="text-text-primary font-semibold">
                          {user.username}
                        </Typography>
                        <Typography variant="caption" className="text-text-secondary">
                          {hasRole([USER_ROLE.ADMIN]) ? 'Administrátor' : 'Uživatel'}
                        </Typography>
                      </Box>
                      <Divider sx={{ opacity: 0.6 }} />
                      <MenuItem onClick={handleProfileClick} sx={{ py: 1, px: 2 }}>
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
                          <MenuItem onClick={() => navigate('/dashboard/system')} sx={{ py: 1, px: 2 }}>
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
                          <MenuItem onClick={() => navigate('/docs')} sx={{ py: 1, px: 2 }}>
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
                          <MenuItem onClick={() => navigate('/activity')} sx={{ py: 1, px: 2 }}>
                            <ListItemIcon>
                              <HistoryIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Aktivita"
                              primaryTypographyProps={{
                                className: "font-medium"
                              }}
                            />
                          </MenuItem>
                        </>
                      )}
                      <Divider sx={{ opacity: 0.6 }} />
                      <MenuItem 
                        onClick={handleLogout} 
                        className="hover:bg-red-50 text-red-600"
                        sx={{ py: 1, px: 2 }}
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
                      className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary-hover shadow-md transition-all duration-200"
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