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
  Drawer,
  List,
  ListItem,
  ListItemButton,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  AccessTime as AccessTimeIcon,
  Event as EventIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { FaBook } from 'react-icons/fa';
import { format } from 'date-fns';
import translations from '../locales/cs/common.header.json';
import { useActiveEvent } from '../contexts/ActiveEventContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { useHeaderVisibility } from '../contexts/HeaderVisibilityContext';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

export default function Header() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { activeEvent } = useActiveEvent();
  const { mode, toggleMode } = useAppTheme();
  const { isHeaderVisible } = useHeaderVisibility();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    handleCloseMenu();
    setMobileMenuOpen(false);
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
    setMobileMenuOpen(false);
    if (hasRole([USER_ROLE.ADMIN, USER_ROLE.USER])) {
      navigate('/profile');
    } else {
      navigate('/');
    }
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;
  const isLandingPage = location.pathname === '/';

  // Navigation items for mobile menu
  const getNavigationItems = () => {
    if (!user) return [];
    
    const items = [];
    
    if (hasRole([USER_ROLE.ADMIN])) {
      items.push(
        { to: '/dashboard', label: translations.navigation.dashboard, icon: null },
        { to: '/events', label: translations.navigation.events, icon: null }
      );
      
      if (activeEvent) {
        items.push(
          { to: '/dashboard/participants', label: translations.navigation.participants, icon: null },
          { to: '/dashboard/barrels', label: translations.navigation.barrels, icon: null },
          { to: '/leaderboard', label: translations.navigation.leaderboard, icon: null }
        );
      }
    }
    
    if (user?.role === USER_ROLE.USER) {
      items.push(
        { to: `/${user?.id}/dashboard`, label: 'Moje statistiky', icon: null },
        { to: '/achievements', label: 'Úspěchy', icon: null }
      );
    }
    
    return items;
  };

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      {isHeaderVisible && (
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          style={{
            position: 'fixed',
            width: '100%',
            zIndex: 50,
            backgroundColor: mode === 'dark' ? 'rgba(13, 17, 23, 0.95)' : 'rgba(250, 250, 250, 0.95)',
            backdropFilter: 'blur(8px)',
            boxShadow: mode === 'dark' ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
            transition: 'all 0.3s ease'
          }}
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
                
                {/* Desktop Navigation - Hidden on mobile */}
                {user && (
                  <div className="hidden md:flex ml-10 items-center space-x-4">
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
                {/* Theme Toggle - Always visible */}
                <IconButton
                  size="small"
                  onClick={toggleMode}
                  aria-label="Toggle theme"
                  className="bg-gradient-to-br from-background-secondary/15 to-background-secondary/5 hover:from-background-secondary/25 hover:to-background-secondary/10 border border-border-secondary/30 shadow-sm"
                  sx={{
                    width: 36,
                    height: 36,
                    marginRight: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                    }
                  }}
                >
                  {mode === 'light' ? (
                    <DarkModeIcon fontSize="small" />
                  ) : (
                    <LightModeIcon fontSize="small" />
                  )}
                </IconButton>
                
                {user ? (
                  <div className="flex items-center space-x-3">
                    {/* Active Event Info - Hidden on mobile */}
                    {activeEvent && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="hidden md:flex items-center bg-background-secondary/60 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-border-secondary/30"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
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
                          <div className="flex items-center space-x-2">
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
                    
                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                      <IconButton
                        onClick={() => setMobileMenuOpen(true)}
                        size="small"
                        className="bg-gradient-to-br from-background-secondary/15 to-background-secondary/5 hover:from-background-secondary/25 hover:to-background-secondary/10 border border-border-secondary/30 shadow-sm"
                        sx={{
                          width: 36,
                          height: 36,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                          }
                        }}
                      >
                        <MenuIcon fontSize="small" />
                      </IconButton>
                    </div>

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
                            width: 36, 
                            height: 36,
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
      )}
      
      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleMobileMenuClose}
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
          <Typography variant="h6" className="text-text-primary font-semibold mb-4">
            Navigace
          </Typography>
          
          <List>
            {getNavigationItems().map((item) => (
              <ListItem key={item.to} disablePadding>
                <ListItemButton
                  onClick={() => {
                    navigate(item.to);
                    handleMobileMenuClose();
                  }}
                  className={`${
                    isActive(item.to)
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-primary hover:bg-background-secondary/50'
                  }`}
                  sx={{ borderRadius: 1, mb: 0.5 }}
                >
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      className: "font-medium"
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          
          {/* Active Event Info for Mobile */}
          {activeEvent && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
              <Typography variant="subtitle2" className="text-text-primary font-semibold mb-2">
                Aktivní událost
              </Typography>
              <div className="flex items-center space-x-2">
                <EventIcon className="text-text-secondary" fontSize="small" />
                <Chip
                  label={activeEvent.name}
                  size="small"
                  className="bg-primary/10 text-primary border-primary/20"
                />
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <AccessTimeIcon className="text-text-secondary" fontSize="small" />
                <Typography variant="body2" className="text-text-primary font-mono">
                  {format(new Date(currentTime), 'HH:mm:ss')}
                </Typography>
              </div>
            </Box>
          )}
        </Box>
      </Drawer>
      
      <main className={`${isLandingPage ? '' : 'max-w-7xl mx-auto py-6 pt-20'}`}>
        <Outlet />
      </main>
    </Box>
  );
} 