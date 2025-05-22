import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  Button,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ParticipantsTable } from './ParticipantsTable';
import { useParticipants } from './useParticipants';
import { AddParticipantDialog } from './AddParticipantDialog';

const ParticipantsPage: React.FC = () => {
  const [showDeleted, setShowDeleted] = useState(false);
  const {
    participants,
    deletedParticipants,
    isLoading,
    handleDelete,
    handleAddBeer,
    handleRemoveBeer,
    handleCleanup,
    fetchParticipants,
  } = useParticipants(showDeleted);

  const [dialogOpen, setDialogOpen] = useState(false);

  const { maleParticipants, femaleParticipants } = useMemo(() => {
    const activeParticipants = showDeleted ? [...participants, ...deletedParticipants] : participants;
    return {
      maleParticipants: activeParticipants.filter(p => p.gender === 'MALE'),
      femaleParticipants: activeParticipants.filter(p => p.gender === 'FEMALE')
    };
  }, [participants, deletedParticipants, showDeleted]);

  const confirmCleanup = async () => {
    if (window.confirm('Are you sure you want to delete all participants? This cannot be undone.')) {
      await handleCleanup();
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Participants</Typography>
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
            Add Participant
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

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Male Participants ({maleParticipants.length})
          </Typography>
          {isLoading ? (
            <CircularProgress />
          ) : (
            <ParticipantsTable
              participants={maleParticipants}
              onDelete={handleDelete}
              onAddBeer={handleAddBeer}
              onRemoveBeer={handleRemoveBeer}
              showDeletedStatus={showDeleted}
            />
          )}
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Female Participants ({femaleParticipants.length})
          </Typography>
          {isLoading ? (
            <CircularProgress />
          ) : (
            <ParticipantsTable
              participants={femaleParticipants}
              onDelete={handleDelete}
              onAddBeer={handleAddBeer}
              onRemoveBeer={handleRemoveBeer}
              showDeletedStatus={showDeleted}
            />
          )}
        </Grid>
      </Grid>

      <AddParticipantDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => {
          setDialogOpen(false);
          fetchParticipants();
        }}
        existingNames={participants.map(p => p.name)}
      />
    </Box>
  );
};

export default ParticipantsPage; 