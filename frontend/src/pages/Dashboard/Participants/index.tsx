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
import { useFeatureFlag } from '../../../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../../../types/featureFlags';
import translations from '../../../locales/cs/dashboard.participants.json';

const ParticipantsPage: React.FC = () => {
  const [showDeleted, setShowDeleted] = useState(false);
  const showDeletedFeature = useFeatureFlag(FeatureFlagKey.SHOW_DELETED_PARTICIPANTS);
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
    if (window.confirm(translations.dialogs.cleanupAll.message)) {
      await handleCleanup();
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{translations.title}</Typography>
        <Box>
          {showDeletedFeature && (
            <FormControlLabel
              control={
                <Switch
                  checked={showDeleted}
                  onChange={(e) => setShowDeleted(e.target.checked)}
                />
              }
              label={translations.actions.showDeleted}
            />
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            {translations.actions.addParticipant}
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={confirmCleanup}
          >
            {translations.actions.cleanupAll}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            {translations.sections.male} ({maleParticipants.length} {translations.sections.count})
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
            {translations.sections.female} ({femaleParticipants.length} {translations.sections.count})
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