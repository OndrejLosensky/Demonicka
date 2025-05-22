import React, { useMemo, useState } from 'react';
import { Box, Typography, CircularProgress, Grid, Button } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ParticipantsTable } from './ParticipantsTable';
import { useParticipants } from './useParticipants';
import { AddParticipantDialog } from './AddParticipantDialog';

const ParticipantsPage: React.FC = () => {
  const {
    participants,
    isLoading,
    handleDelete,
    handleAddBeer,
    handleRemoveBeer,
    handleCleanup,
    fetchParticipants,
  } = useParticipants();

  const [dialogOpen, setDialogOpen] = useState(false);

  const { maleParticipants, femaleParticipants } = useMemo(() => {
    return {
      maleParticipants: participants.filter(p => p.gender === 'MALE'),
      femaleParticipants: participants.filter(p => p.gender === 'FEMALE')
    };
  }, [participants]);

  const confirmCleanup = async () => {
    if (window.confirm('Are you sure you want to delete all participants? This cannot be undone.')) {
      await handleCleanup();
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
          Participants
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
            Add Participant
          </Button>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Male Participants
          </Typography>
          <ParticipantsTable
            participants={maleParticipants}
            onAddBeer={handleAddBeer}
            onRemoveBeer={handleRemoveBeer}
            onDelete={handleDelete}
            showGender={false}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Female Participants
          </Typography>
          <ParticipantsTable
            participants={femaleParticipants}
            onAddBeer={handleAddBeer}
            onRemoveBeer={handleRemoveBeer}
            onDelete={handleDelete}
            showGender={false}
          />
        </Grid>
      </Grid>

      <AddParticipantDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => {
          setDialogOpen(false);
          void fetchParticipants();
        }}
        existingNames={participants.map(p => p.name.toLowerCase())}
      />
    </Box>
  );
};

export default ParticipantsPage; 