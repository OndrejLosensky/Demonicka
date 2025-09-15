import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Menu as MenuIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSidebar } from '../../contexts/SidebarContext';

interface SidebarHeaderProps {
  onMenuClick: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ onMenuClick }) => {
  const { isCollapsed, toggleCollapse } = useSidebar();

  return (
    <Box sx={{ 
      p: 1.5, 
      borderBottom: '1px solid', 
      borderColor: 'divider',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 56,
      position: 'relative'
    }}>
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center"
      >
        <Link to="/" className="flex items-center justify-center">
          <img
            src="/logo.svg"
            alt="Démonická"
            className="h-10 w-auto hover:opacity-80 transition-opacity duration-200"
            style={{ maxWidth: isCollapsed ? '40px' : 'none' }}
          />
        </Link>
      </motion.div>

      {/* Collapse/Expand Button */}
      <Tooltip title={isCollapsed ? 'Rozbalit postranní panel' : 'Sbalit postranní panel'} arrow>
        <IconButton
          onClick={toggleCollapse}
          size="small"
          className="absolute right-2 bg-gradient-to-br from-background-secondary/15 to-background-secondary/5 hover:from-background-secondary/25 hover:to-background-secondary/10 border border-border-secondary/30 shadow-sm"
          sx={{
            width: 32,
            height: 32,
            transition: 'all 0.2s ease-in-out',
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            justifyContent: 'center',
            top: '50%',
            transform: 'translateY(-50%)',
            '&:hover': {
              transform: 'translateY(-50%) translateY(-1px)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
            }
          }}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeftIcon fontSize="small" />
          </motion.div>
        </IconButton>
      </Tooltip>

      {/* Mobile Menu Button */}
      <IconButton
        onClick={onMenuClick}
        size="small"
        className="absolute right-2 bg-gradient-to-br from-background-secondary/15 to-background-secondary/5 hover:from-background-secondary/25 hover:to-background-secondary/10 border border-border-secondary/30 shadow-sm"
        sx={{
          width: 32,
          height: 32,
          transition: 'all 0.2s ease-in-out',
          display: { xs: 'flex', md: 'none' },
          alignItems: 'center',
          justifyContent: 'center',
          top: '50%',
          transform: 'translateY(-50%)',
          '&:hover': {
            transform: 'translateY(-50%) translateY(-1px)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
          }
        }}
      >
        <MenuIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};
