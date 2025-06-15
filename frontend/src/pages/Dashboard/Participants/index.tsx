import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  FormControlLabel,
  Switch,
  Container,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ParticipantsTable } from './ParticipantsTable';
import { useParticipants } from './useParticipants';
import { AddParticipantDialog } from './AddParticipantDialog';
import { useFeatureFlag } from '../../../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../../../types/featureFlags';
import { EventSelector } from '../../../components/EventSelector';
import { EmptyEventState } from '../../../components/EmptyEventState';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import translations from '../../../locales/cs/dashboard.participants.json';

const ParticipantsPage: React.FC = () => {
  const [showDeleted, setShowDeleted] = useState(false);
  const showDeletedFeature = useFeatureFlag(FeatureFlagKey.SHOW_DELETED_PARTICIPANTS);
  const showEventHistory = useFeatureFlag(FeatureFlagKey.SHOW_EVENT_HISTORY);
  const { activeEvent } = useActiveEvent();
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

  // Force refresh when active event changes
  useEffect(() => {
    fetchParticipants();
  }, [activeEvent?.id, activeEvent?.updatedAt, fetchParticipants]);

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

  if (!activeEvent) {
    return (
      <Container>
        <EmptyEventState
          title={translations.emptyState.title}
          subtitle={translations.emptyState.subtitle}
        />
      </Container>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h4">{translations.title}</Typography>
          {showEventHistory && <EventSelector />}
        </Box>
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

      {isLoading ? (
        <CircularProgress />
      ) : (
        <ParticipantsTable
          participants={participants}
          deletedParticipants={deletedParticipants}
          showDeleted={showDeleted}
          onDelete={handleDelete}
          onAddBeer={handleAddBeer}
          onRemoveBeer={handleRemoveBeer}
          maleCount={maleParticipants.length}
          femaleCount={femaleParticipants.length}
        />
      )}

      <AddParticipantDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => {
          setDialogOpen(false);
          fetchParticipants();
        }}
      />
    </Box>
  );
};

export default ParticipantsPage; 