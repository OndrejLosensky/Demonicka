import React from 'react';
import { ListItemButton, ListItemIcon, ListItemText, Box, Tooltip } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSidebar } from '../../contexts/SidebarContext';

// Icon mapping for Material Icons
const iconMap: { [key: string]: string } = {
  dashboard: 'dashboard',
  event: 'event',
  people: 'people',
  local_drink: 'local_drink',
  leaderboard: 'leaderboard',
  analytics: 'analytics',
  emoji_events: 'emoji_events',
  settings: 'settings',
  history: 'history',
  book: 'menu_book',
};

interface NavigationItemProps {
  to: string;
  label: string;
  icon: string;
}

export const NavigationItem: React.FC<NavigationItemProps> = ({ to, label, icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const { isCollapsed } = useSidebar();

  const IconComponent = iconMap[icon] || 'circle';

  const buttonContent = (
    <ListItemButton
      component={Link}
      to={to}
      className={`transition-all duration-200 ${
        isActive
          ? 'bg-primary/10 text-primary border-r-2 border-primary'
          : 'text-text-primary hover:bg-background-secondary/50 hover:text-text-secondary'
      }`}
      sx={{
        borderRadius: '8px',
        mx: isCollapsed ? 0.5 : 1,
        my: 0.5,
        minHeight: 44,
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        px: isCollapsed ? 1 : 2,
        '&:hover': {
          backgroundColor: isActive ? 'primary.main' : 'action.hover',
          transform: isCollapsed ? 'scale(1.05)' : 'translateX(2px)',
        },
        '&.Mui-selected': {
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          '&:hover': {
            backgroundColor: 'primary.dark',
          },
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: isCollapsed ? 'auto' : 40,
          color: isActive ? 'primary.main' : 'text.secondary',
          transition: 'color 0.2s ease',
          justifyContent: 'center',
        }}
      >
        <Box
          component="span"
          className="material-icons"
          sx={{
            fontSize: '1.2rem',
            fontWeight: isActive ? 600 : 400,
          }}
        >
          {IconComponent}
        </Box>
      </ListItemIcon>
      {!isCollapsed && (
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            fontSize: '0.9rem',
            fontWeight: isActive ? 600 : 500,
            className: isActive ? 'text-primary' : 'text-text-primary',
          }}
        />
      )}
    </ListItemButton>
  );

  if (isCollapsed) {
    return (
      <Tooltip title={label} arrow placement="right">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ width: '100%' }}
        >
          {buttonContent}
        </motion.div>
      </Tooltip>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{ width: '100%' }}
    >
      {buttonContent}
    </motion.div>
  );
};
