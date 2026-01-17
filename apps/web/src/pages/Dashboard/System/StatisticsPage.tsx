import React, { useState, useCallback } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { SystemHealthDashboard } from './components/SystemHealthDashboard';
import { systemService } from '../../../services/systemService';

const StatisticsPage: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Refresh system stats
      await systemService.getSystemStats();
      // SystemHealthDashboard has its own refresh mechanism
    } catch (error) {
      console.error('Failed to refresh statistics:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Statistiky systému
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          Obnovit
        </Button>
      </Box>

      <SystemHealthDashboard onRefresh={handleRefresh} />
    </Box>
  );
};

export { StatisticsPage };
