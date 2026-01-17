import React, { useCallback } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { CleanupSection } from './components/CleanupSection';
import { useAuth } from '../../../contexts/AuthContext';
import { systemService } from '../../../services/systemService';

const OperationsPage: React.FC = () => {
  const { user } = useAuth();

  const handleRefresh = useCallback(async () => {
    try {
      await systemService.getSystemStats();
    } catch (error) {
      console.error('Failed to refresh operations:', error);
    }
  }, []);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Systémové operace
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          Obnovit
        </Button>
      </Box>

      <CleanupSection onRefresh={handleRefresh} userRole={user?.role} />
    </Box>
  );
};

export { OperationsPage };
