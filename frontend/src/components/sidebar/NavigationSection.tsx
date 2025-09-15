import React from 'react';
import { Box, Typography, List, ListItem } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NavigationItem } from './NavigationItem';
import { useSidebar } from '../../contexts/SidebarContext';

interface NavigationItem {
  to: string;
  label: string;
  icon: string;
}

interface NavigationSectionProps {
  title: string;
  items: NavigationItem[];
  isLast?: boolean;
}

export const NavigationSection: React.FC<NavigationSectionProps> = ({ 
  title, 
  items, 
  isLast = false 
}) => {
  const { isCollapsed } = useSidebar();

  return (
    <Box sx={{ mb: isLast ? 0 : 2 }}>
      {/* Section Title - Hidden when collapsed */}
      {!isCollapsed && (
        <Typography
          variant="caption"
          className="text-text-secondary font-semibold uppercase tracking-wide"
          sx={{
            px: 3,
            py: 1,
            display: 'block',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.5px',
            opacity: 0.8
          }}
        >
          {title}
        </Typography>
      )}

      {/* Navigation Items */}
      <List sx={{ py: 0 }}>
        {items.map((item, index) => (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <ListItem disablePadding sx={{ px: isCollapsed ? 0.5 : 1 }}>
              <NavigationItem
                to={item.to}
                label={item.label}
                icon={item.icon}
              />
            </ListItem>
          </motion.div>
        ))}
      </List>
    </Box>
  );
};
