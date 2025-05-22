import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { BarrelsTable } from './BarrelsTable';
import { useBarrels } from './useBarrels';
import { AddBarrelDialog } from './AddBarrelDialog';

const BarrelsPage: React.FC = () => {
  const {
    barrels,
    isLoading,
    handleDelete,
    handleToggleActive,
    handleCleanup,
    fetchBarrels,
  } = useBarrels();

  const [dialogOpen, setDialogOpen] = useState(false);

  const confirmCleanup = async () => {
    console.log('Cleanup button clicked');
    if (window.confirm('Are you sure you want to delete all barrels? This cannot be undone.')) {
      console.log('Cleanup confirmed, calling handleCleanup');
      try {
        await handleCleanup();
        console.log('Cleanup completed successfully');
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    } else {
      console.log('Cleanup cancelled by user');
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Barrels
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={confirmCleanup}
          >
            Cleanup All
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Add Barrel
          </Button>
        </Box>
      </Box>

      <BarrelsTable
        barrels={barrels}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />

      <AddBarrelDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => {
          setDialogOpen(false);
          void fetchBarrels();
        }}
      />
    </Box>
  );
};

export default BarrelsPage; 