import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  FormControlLabel,
  Switch,
  Container,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
} from '@mui/material';
import { 
  Add as AddIcon, 
  ViewList as ViewListIcon, 
  ViewModule as ViewModuleIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
} from '@mui/icons-material';
import { ParticipantsTable } from './ParticipantsTable';
import { useParticipants } from './useParticipants';
import { AddParticipantDialog } from './AddParticipantDialog';
import { useFeatureFlag } from '../../../../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../../../../types/featureFlags';
import { EventSelector } from '../../EventSelector';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { EmptyEventState } from '../../EmptyEventState';
import { useActiveEvent } from '../../../../contexts/ActiveEventContext';
import translations from '../../../../locales/cs/dashboard.participants.json';
import { withPageLoader } from '../../../../components/hoc/withPageLoader';
import { usePageTitle } from '../../../../hooks/usePageTitle';

const ParticipantsPage: React.FC = () => {
  usePageTitle('Účastníci');
  const [showDeleted, setShowDeleted] = useState(false);
  const [viewMode, setViewMode] = useState<'combined' | 'split'>('combined');
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
    handleAddSpilledBeer,
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

  // Force refresh when active event changes
  useEffect(() => {
    fetchParticipants();
  }, [activeEvent?.id, activeEvent?.updatedAt, fetchParticipants]);

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
      <PageHeader title={translations.title} left={showEventHistory ? <EventSelector /> : null} action={
        <Box display="flex" alignItems="center" gap={2}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="combined">
              <ViewListIcon />
            </ToggleButton>
            <ToggleButton value="split">
              <ViewModuleIcon />
            </ToggleButton>
          </ToggleButtonGroup>
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
            color="error"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            {translations.actions.addParticipant}
          </Button>
        </Box>
      } />

      {isLoading ? (
        <CircularProgress />
      ) : viewMode === 'combined' ? (
        <ParticipantsTable
          participants={participants}
          deletedParticipants={deletedParticipants}
          showDeleted={showDeleted}
          onDelete={handleDelete}
          onAddBeer={handleAddBeer}
          onRemoveBeer={handleRemoveBeer}
          onAddSpilledBeer={handleAddSpilledBeer}
        />
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <MaleIcon color="primary" />
              {translations.sections.male} ({maleParticipants.length})
            </Typography>
            <ParticipantsTable
              participants={maleParticipants}
              deletedParticipants={[]}
              showDeleted={showDeleted}
              onDelete={handleDelete}
              onAddBeer={handleAddBeer}
              onRemoveBeer={handleRemoveBeer}
              onAddSpilledBeer={handleAddSpilledBeer}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FemaleIcon sx={{ color: '#E91E63' }} />
              {translations.sections.female} ({femaleParticipants.length})
            </Typography>
            <ParticipantsTable
              participants={femaleParticipants}
              deletedParticipants={[]}
              showDeleted={showDeleted}
              onDelete={handleDelete}
              onAddBeer={handleAddBeer}
              onRemoveBeer={handleRemoveBeer}
              onAddSpilledBeer={handleAddSpilledBeer}
            />
          </Grid>
        </Grid>
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

const Participants = withPageLoader(ParticipantsPage);
export default Participants; 