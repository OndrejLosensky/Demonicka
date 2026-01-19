import React from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import {
  People as PeopleIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  Build as BuildIcon,
} from '@mui/icons-material';

const SystemLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab based on current route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/users')) return 0;
    if (path.includes('/statistics')) return 1;
    if (path.includes('/operations')) return 2;
    if (path.includes('/settings')) return 3;
    return 0; // Default to users
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    const routes = ['/dashboard/system/users', '/dashboard/system/statistics', '/dashboard/system/operations', '/dashboard/system/settings'];
    navigate(routes[newValue]);
  };

  return (
    <Box>
      <Paper sx={{ mb: 3, borderRadius: 2, mt: 3 }}>
        <Tabs
          value={getActiveTab()}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
          }}
        >
          <Tab
            icon={<PeopleIcon />}
            iconPosition="start"
            label="Uživatelé"
            sx={{
              textTransform: 'none',
              fontWeight: 'medium',
              minHeight: 48,
            }}
          />
          <Tab
            icon={<BarChartIcon />}
            iconPosition="start"
            label="Statistiky"
            sx={{
              textTransform: 'none',
              fontWeight: 'medium',
              minHeight: 48,
            }}
          />
          <Tab
            icon={<BuildIcon />}
            iconPosition="start"
            label="Operace"
            sx={{
              textTransform: 'none',
              fontWeight: 'medium',
              minHeight: 48,
            }}
          />
          <Tab
            icon={<SettingsIcon />}
            iconPosition="start"
            label="Nastavení"
            sx={{
              textTransform: 'none',
              fontWeight: 'medium',
              minHeight: 48,
            }}
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Paper>
    </Box>
  );
};

export { SystemLayout };
