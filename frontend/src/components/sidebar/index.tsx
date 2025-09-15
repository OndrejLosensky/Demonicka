import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Box, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { SidebarContent } from './SidebarContent';
import { SidebarHeader } from './SidebarHeader';
import { SidebarFooter } from './SidebarFooter';
import { useSidebar } from '../../contexts/SidebarContext';

interface SidebarProps {
  isLandingPage?: boolean;
}

const DRAWER_WIDTH = 280;
const DRAWER_WIDTH_COLLAPSED = 64;
const DRAWER_WIDTH_MOBILE = 260;

export const Sidebar: React.FC<SidebarProps> = ({ isLandingPage = false }) => {
  const { user } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isCollapsed } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Don't show sidebar on landing page or when user is not logged in
  if (isLandingPage || !user) {
    return null;
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const currentDrawerWidth = isCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  const drawerContent = (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      bgcolor: 'background.paper',
      borderRight: '1px solid',
      borderColor: 'divider'
    }}>
      <SidebarHeader onMenuClick={handleDrawerToggle} />
      <SidebarContent />
      <SidebarFooter />
    </Box>
  );

  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH_MOBILE,
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider'
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: currentDrawerWidth,
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
            overflowX: 'hidden',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
};
