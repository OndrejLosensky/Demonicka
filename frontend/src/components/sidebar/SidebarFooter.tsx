import React, { useState } from 'react';
import { 
  Box, 
  Avatar, 
  IconButton, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Typography,
  Tooltip
} from '@mui/material';
import { useSidebar } from '../../contexts/SidebarContext';
import { 
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import { FaBook } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { USER_ROLE } from '../../types/user';
import translations from '../../locales/cs/common.header.json';

export const SidebarFooter: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const { mode, toggleMode } = useAppTheme();
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    handleProfileMenuClose();
    if (hasRole([USER_ROLE.ADMIN, USER_ROLE.USER])) {
      navigate('/profile');
    } else {
      navigate('/');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ 
      p: 2, 
      borderTop: '1px solid', 
      borderColor: 'divider',
      bgcolor: 'background.default',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch'
    }}>
      {/* Theme Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, px: isCollapsed ? 0.5 : 1 }}>
        <Tooltip title={`Přepnout na ${mode === 'light' ? 'tmavý' : 'světlý'} režim`} arrow placement={isCollapsed ? 'right' : 'top'}>
          <IconButton
            onClick={toggleMode}
            size="small"
            className="bg-gradient-to-br from-background-secondary/15 to-background-secondary/5 hover:from-background-secondary/25 hover:to-background-secondary/10 border border-border-secondary/30 shadow-sm"
            sx={{
              width: isCollapsed ? 32 : 36,
              height: isCollapsed ? 32 : 36,
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
        </Tooltip>
      </Box>

      {/* User Profile */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Tooltip 
          title={isCollapsed ? `${translations.auth.profile} - ${user.username}` : `${translations.auth.profile} - ${user.username}`}
          arrow
          placement={isCollapsed ? 'right' : 'top'}
        >
          <IconButton
            onClick={handleProfileMenuOpen}
            size="medium"
            className="w-full bg-gradient-to-br from-primary/15 to-primary/5 hover:from-primary/25 hover:to-primary/10 border border-primary/30 shadow-sm"
            sx={{ 
              width: '100%',
              height: isCollapsed ? 40 : 48,
              borderRadius: 2,
              transition: 'all 0.2s ease-in-out',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              px: isCollapsed ? 1 : 2,
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? 0 : 2, width: '100%', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
              <Avatar 
                sx={{ 
                  width: isCollapsed ? 28 : 32, 
                  height: isCollapsed ? 28 : 32,
                  bgcolor: 'primary.main',
                  fontWeight: 700,
                  fontSize: isCollapsed ? '0.75rem' : '0.875rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  flexShrink: 0
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              {!isCollapsed && (
                <Box sx={{ 
                  flex: 1, 
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: 32
                }}>
                  <Typography 
                    variant="subtitle2" 
                    className="text-text-primary font-semibold"
                    sx={{ fontSize: '0.85rem', lineHeight: 1.2, mb: 0.25 }}
                  >
                    {user.username}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    className="text-text-secondary"
                    sx={{ fontSize: '0.7rem', lineHeight: 1 }}
                  >
                    {hasRole([USER_ROLE.ADMIN]) ? 'Administrátor' : 'Uživatel'}
                  </Typography>
                </Box>
              )}
            </Box>
          </IconButton>
        </Tooltip>
      </motion.div>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 8,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 8px 24px rgba(0,0,0,0.12))',
            mt: 1,
            minWidth: 200,
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
              right: 20,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
              boxShadow: '0px -2px 4px rgba(0,0,0,0.06)',
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
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
    </Box>
  );
};
