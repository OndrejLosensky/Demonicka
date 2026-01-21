import React from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import {
  People as PeopleIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { USER_ROLE } from '@demonicka/shared-types';

const SystemLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isOperator = user?.role === USER_ROLE.OPERATOR;
  const tabs = isOperator
    ? [{ path: '/dashboard/system/users', label: 'Uživatelé', icon: <PeopleIcon /> }]
    : [
        { path: '/dashboard/system/users', label: 'Uživatelé', icon: <PeopleIcon /> },
        { path: '/dashboard/system/statistics', label: 'Statistiky', icon: <BarChartIcon /> },
        { path: '/dashboard/system/operations', label: 'Operace', icon: <BuildIcon /> },
        { path: '/dashboard/system/settings', label: 'Nastavení', icon: <SettingsIcon /> },
      ];

  // Determine active tab based on current route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/users')) return 0;
    if (!isOperator && path.includes('/statistics')) return 1;
    if (!isOperator && path.includes('/operations')) return 2;
    if (!isOperator && path.includes('/settings')) return 3;
    return 0; // Default to users
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    navigate(tabs[newValue].path);
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
          {tabs.map((t) => (
            <Tab
              key={t.path}
              icon={t.icon}
              iconPosition="start"
              label={t.label}
              sx={{
                textTransform: 'none',
                fontWeight: 'medium',
                minHeight: 48,
              }}
            />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Paper>
    </Box>
  );
};

export { SystemLayout };
