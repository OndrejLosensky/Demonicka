import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { Sidebar } from './sidebar';
import Header from './Header';
import { TopNavigation } from './TopNavigation';
import { useSidebar } from '../contexts/SidebarContext';

const DRAWER_WIDTH = 280;
const DRAWER_WIDTH_COLLAPSED = 64;

export default function Layout() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const { isCollapsed } = useSidebar();
  
  const currentDrawerWidth = isCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Show sidebar for all pages except landing */}
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
        {/* Show header only on landing page */}
        {isLandingPage && <Header />}
        
        {/* Show top navigation for authenticated pages */}
        {!isLandingPage && <TopNavigation isLandingPage={isLandingPage} />}
        
        {/* Page content */}
        <Box sx={{ 
          minHeight: '100vh',
          ...(isLandingPage ? {} : { 
            pt: 7, // Account for top navigation (56px) + padding
            pb: 3,
            px: { xs: 2, sm: 3, md: 4, lg: 6 }
          })
        }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
