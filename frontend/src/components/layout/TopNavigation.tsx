import React, { useState, useRef, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box, 
  Breadcrumbs, 
  Link, 
  Chip,
  Tooltip,
  Badge,
  InputBase,
  alpha,
  ClickAwayListener
} from '@mui/material';
import { 
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Help as HelpIcon,
  Home as HomeIcon,
  ChevronRight as ChevronRightIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Close as CloseIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useActiveEvent } from '../../contexts/ActiveEventContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useSearch } from '../../contexts/SearchContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { SearchResults } from '../search/SearchResults';

interface TopNavigationProps {
  isLandingPage?: boolean;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({ isLandingPage = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeEvent } = useActiveEvent();
  const { isCollapsed } = useSidebar();
  const { mode, toggleMode } = useAppTheme();
  const { 
    isSearchOpen, 
    searchQuery, 
    searchResults, 
    isLoading, 
    openSearch, 
    closeSearch, 
    setSearchQuery, 
    performSearch, 
    clearSearch 
  } = useSearch();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        openSearch();
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      if (event.key === 'Escape') {
        closeSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openSearch, closeSearch]);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Don't show on landing page or when user is not logged in
  if (isLandingPage || !user) {
    return null;
  }

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];

    // Always start with home
    breadcrumbs.push({
      label: 'Domů',
      path: '/dashboard',
      icon: <HomeIcon fontSize="small" />
    });

    // Add path segments
    pathSegments.forEach((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      let label = segment;

      // Translate segment names
      switch (segment) {
        case 'dashboard':
          label = 'Dashboard';
          break;
        case 'participants':
          label = 'Účastníci';
          break;
        case 'barrels':
          label = 'Sudy';
          break;
        case 'events':
          label = 'Události';
          break;
        case 'leaderboard':
          label = 'Žebříček';
          break;
        case 'achievements':
          label = 'Úspěchy';
          break;
        case 'activity':
          label = 'Aktivita';
          break;
        case 'docs':
          label = 'Dokumentace';
          break;
        case 'system':
          label = 'Systém';
          break;
        case 'profile':
          label = 'Profil';
          break;
        default:
          // Handle user IDs (for personal dashboards)
          if (/^\d+$/.test(segment)) {
            label = 'Osobní dashboard';
          } else {
            label = segment.charAt(0).toUpperCase() + segment.slice(1);
          }
      }

      breadcrumbs.push({
        label,
        path,
        isLast: index === pathSegments.length - 1
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  const currentPageTitle = breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard';

  // Handle search input changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
    performSearch(value);
  };

  return (
    <motion.div
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          top: 0,
          left: isCollapsed ? 64 : 280,
          right: 0,
          width: `calc(100% - ${isCollapsed ? 64 : 280}px)`,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.3s ease',
          zIndex: 1100,
        }}
      >
        <Toolbar 
          sx={{ 
            minHeight: 56,
            px: { xs: 2, sm: 3 },
            gap: 2
          }}
        >
          {/* Breadcrumbs */}
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Breadcrumbs
              separator={<ChevronRightIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
              sx={{ 
                '& .MuiBreadcrumbs-separator': { 
                  mx: 1 
                } 
              }}
            >
              {breadcrumbs.map((crumb, index) => (
                <Box key={crumb.path} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {index === 0 && crumb.icon}
                  {crumb.isLast ? (
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 600,
                        color: 'text.primary',
                        fontSize: '1.1rem'
                      }}
                    >
                      {crumb.label}
                    </Typography>
                  ) : (
                    <Link
                      component="button"
                      variant="body2"
                      onClick={() => navigate(crumb.path)}
                      sx={{
                        color: 'text.secondary',
                        textDecoration: 'none',
                        '&:hover': {
                          color: 'primary.main',
                          textDecoration: 'underline'
                        },
                        cursor: 'pointer'
                      }}
                    >
                      {crumb.label}
                    </Link>
                  )}
                </Box>
              ))}
            </Breadcrumbs>
          </Box>

          {/* Quick Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Theme Toggle */}
            <Tooltip title={`Přepnout na ${mode === 'light' ? 'tmavý' : 'světlý'} režim`} arrow>
              <IconButton
                onClick={toggleMode}
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: alpha('#000', 0.04)
                  }
                }}
              >
                {mode === 'light' ? (
                  <DarkModeIcon fontSize="small" />
                ) : (
                  <LightModeIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>

            {/* Search */}
            <Tooltip title="Vyhledávání (Ctrl+K)" arrow>
              <IconButton
                size="small"
                onClick={openSearch}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: alpha('#000', 0.04)
                  }
                }}
              >
                <SearchIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Oznámení" arrow>
              <IconButton
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: alpha('#000', 0.04)
                  }
                }}
              >
                <Badge badgeContent={0} color="error" variant="dot">
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Help */}
            <Tooltip title="Nápověda" arrow>
              <IconButton
                size="small"
                onClick={() => navigate('/docs')}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: alpha('#000', 0.04)
                  }
                }}
              >
                <HelpIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Connection Status */}
            <Tooltip title="Připojení" arrow>
              <IconButton
                size="small"
                sx={{
                  color: 'success.main',
                  '&:hover': {
                    bgcolor: alpha('#000', 0.04)
                  }
                }}
              >
                <WifiIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>

        {/* Search Bar (Expandable) */}
        <ClickAwayListener onClickAway={closeSearch}>
          <Box sx={{ position: 'relative' }}>
            {isSearchOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Box sx={{ 
                  px: 3, 
                  pb: 2,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default'
                }}>
                  <Box sx={{ position: 'relative' }}>
                    <InputBase
                      ref={searchInputRef}
                      placeholder="Vyhledat účastníky, události, sudy..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      sx={{
                        width: '100%',
                        py: 1,
                        px: 2,
                        pr: 4,
                        bgcolor: 'background.paper',
                        borderRadius: 0,
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:focus': {
                          borderColor: 'primary.main'
                        }
                      }}
                      startAdornment={<SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                      endAdornment={
                        searchQuery && (
                          <IconButton
                            size="small"
                            onClick={clearSearch}
                            sx={{ 
                              position: 'absolute',
                              right: 8,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: 20,
                              height: 20
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        )
                      }
                    />
                    
                    {/* Search Results Dropdown */}
                    <SearchResults 
                      anchorEl={searchInputRef.current}
                      open={!!searchQuery && searchResults.length > 0}
                      onClose={closeSearch}
                    />
                  </Box>
                </Box>
              </motion.div>
            )}
          </Box>
        </ClickAwayListener>
      </AppBar>
    </motion.div>
  );
};
