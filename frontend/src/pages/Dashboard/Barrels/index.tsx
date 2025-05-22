import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { BarrelsTable } from './BarrelsTable';
import { useBarrels } from './useBarrels';
import { AddBarrelDialog } from './AddBarrelDialog';

const BarrelsPage: React.FC = () => {
  const {
    barrels,
    isLoading,
    handleDelete,
    handleToggleActive,
    fetchBarrels,
  } = useBarrels();

  const [dialogOpen, setDialogOpen] = useState(false);

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
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Add Barrel
        </Button>
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