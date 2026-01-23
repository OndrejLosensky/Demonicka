import React, { useState } from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import {
  Flag as FlagIcon,
  Security as SecurityIcon,
  SportsBar as SportsBarIcon,
  Leaderboard as LeaderboardIcon,
} from '@mui/icons-material';
import RolesPage from './Roles';
import FeatureFlagsPage from './FeatureFlags';
import BeerPongSettingsPage from './BeerPongSettings';
import LeaderboardSettingsPage from './LeaderboardSettings';
import { tokens } from '../../../theme/tokens';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={activeTab}
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
            icon={<FlagIcon />}
            iconPosition="start"
            label="Funkce"
            sx={{
              textTransform: 'none',
              fontWeight: 'medium',
              minHeight: 48,
            }}
          />
          <Tab
            icon={<SecurityIcon />}
            iconPosition="start"
            label="Role a oprávnění"
            sx={{
              textTransform: 'none',
              fontWeight: 'medium',
              minHeight: 48,
            }}
          />
          <Tab
            icon={<SportsBarIcon />}
            iconPosition="start"
            label="Beer Pong"
            sx={{
              textTransform: 'none',
              fontWeight: 'medium',
              minHeight: 48,
            }}
          />
          <Tab
            icon={<LeaderboardIcon />}
            iconPosition="start"
            label="Žebříček"
            sx={{
              textTransform: 'none',
              fontWeight: 'medium',
              minHeight: 48,
            }}
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && <FeatureFlagsPage />}
          {activeTab === 1 && <RolesPage />}
          {activeTab === 2 && <BeerPongSettingsPage />}
          {activeTab === 3 && <LeaderboardSettingsPage />}
        </Box>
      </Paper>
    </Box>
  );
};

export { SettingsPage };
