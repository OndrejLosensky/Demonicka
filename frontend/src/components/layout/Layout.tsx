import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { Sidebar } from '../sidebar';
import LandingHeader from './LandingHeader';
import { TopNavigation } from './TopNavigation';
import { useSidebar } from '../../contexts/SidebarContext';

const DRAWER_WIDTH = 280;
const DRAWER_WIDTH_COLLAPSED = 64;

export default function Layout() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const { isCollapsed } = useSidebar();
  
  const currentDrawerWidth = isCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  if (isLandingPage) {
    // For landing page, don't show sidebar at all
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <LandingHeader />
        <Box sx={{ pt: 8, minHeight: '100vh' }}>
          <Outlet />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Show sidebar for authenticated pages */}
      <Sidebar isLandingPage={isLandingPage} />
      
      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { md: `${currentDrawerWidth}px` },
          transition: 'all 0.3s ease',
          bgcolor: 'background.default',
        }}
      >
        {/* Show top navigation for authenticated pages */}
        <TopNavigation isLandingPage={isLandingPage} />
        
        {/* Page content */}
        <Box sx={{ 
          pt: 7, // Account for top navigation (56px) + padding
          pb: 3,
          px: { xs: 2, sm: 3, md: 4, lg: 6 },
          minHeight: '100vh'
        }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
