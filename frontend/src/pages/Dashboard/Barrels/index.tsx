import React, { useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { BarrelsTable } from './BarrelsTable';
import { useBarrels } from './useBarrels';
import { AddBarrelDialog } from './AddBarrelDialog';

const BarrelsPage: React.FC = () => {
  const [showDeleted, setShowDeleted] = useState(false);
  const {
    barrels,
    deletedBarrels,
    isLoading,
    handleDelete,
    handleToggleActive,
    handleCleanup,
    fetchBarrels,
  } = useBarrels(showDeleted);

  const [dialogOpen, setDialogOpen] = useState(false);

  const allBarrels = showDeleted ? [...barrels, ...deletedBarrels] : barrels;

  const confirmCleanup = async () => {
    if (window.confirm('Are you sure you want to delete all barrels? This cannot be undone.')) {
      await handleCleanup();
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Barrels</Typography>
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
              />
            }
            label="Show Deleted"
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Add Barrel
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={confirmCleanup}
          >
            Cleanup All
          </Button>
        </Box>
      </Box>

      {isLoading ? (
        <CircularProgress />
      ) : (
        <BarrelsTable
          barrels={allBarrels}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          showDeletedStatus={showDeleted}
        />
      )}

      <AddBarrelDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => {
          setDialogOpen(false);
          fetchBarrels();
        }}
      />
    </Box>
  );
};

export default BarrelsPage; 