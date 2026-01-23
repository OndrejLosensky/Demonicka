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
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { 
  Add as AddIcon, 
  ViewList as ViewListIcon, 
  ViewModule as ViewModuleIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
} from '@mui/icons-material';
import { TableSkeleton } from '@demonicka/ui';
import { ParticipantsTable } from './ParticipantsTable';
import { useParticipants } from './useParticipants';
import { participantsApi } from './api';
import { AddParticipantDialog } from './AddParticipantDialog';
import { useFeatureFlag } from '../../../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../../../types/featureFlags';
import { EventSelector } from '../../../components/EventSelector';
import { EmptyEventState } from '../../../components/EmptyEventState';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import translations from '../../../locales/cs/dashboard.participants.json';
import { useDashboardHeaderSlots } from '../../../contexts/DashboardChromeContext';

const ParticipantsPage: React.FC = () => {
  const [showDeleted, setShowDeleted] = useState(false);
  const [viewMode, setViewMode] = useState<'combined' | 'split'>('combined');
  const showDeletedFeature = useFeatureFlag(FeatureFlagKey.SHOW_DELETED_PARTICIPANTS);
  const showEventHistory = useFeatureFlag(FeatureFlagKey.SHOW_EVENT_HISTORY);
  const showUserHistory = useFeatureFlag(FeatureFlagKey.SHOW_USER_HISTORY);
  const { activeEvent } = useActiveEvent();
  const {
    participants,
    deletedParticipants,
    isLoading,
    handleDelete,
    handleRestore,
    handleAddBeer,
    handleAddSpilledBeer,
    handleRemoveBeer,
    fetchParticipants,
  } = useParticipants(showDeleted);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyUsername, setHistoryUsername] = useState<string>('');
  const [historyBeers, setHistoryBeers] = useState<Array<{ id: string; consumedAt: string }>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const openHistory = async (userId: string, username: string) => {
    if (!activeEvent?.id) return;
    setHistoryUsername(username);
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const beers = await participantsApi.getEventBeers(activeEvent.id, userId);
      const visible = beers
        .filter((b) => !b.deletedAt)
        .sort((a, b) => new Date(b.consumedAt).getTime() - new Date(a.consumedAt).getTime())
        .map((b) => ({ id: b.id, consumedAt: b.consumedAt }));
      setHistoryBeers(visible);
    } catch (error) {
      console.error('Failed to load participant history:', error);
      setHistoryBeers([]);
    } finally {
      setHistoryLoading(false);
    }
  };

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

  const headerLeft = useMemo(
    () => (showEventHistory ? <EventSelector variant="compact" /> : undefined),
    [showEventHistory],
  );

  const headerAction = useMemo(
    () =>
      activeEvent ? (
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
      ) : undefined,
    [
      activeEvent?.id,
      viewMode,
      showDeletedFeature,
      showDeleted,
      translations.actions.showDeleted,
      translations.actions.addParticipant,
    ],
  );

  useDashboardHeaderSlots({ left: headerLeft, action: headerAction });

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
    <Box>
      {isLoading ? (
        viewMode === 'combined' ? (
          <TableSkeleton rows={8} columns={5} />
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MaleIcon color="primary" />
                {translations.sections.male}
              </Typography>
              <TableSkeleton rows={6} columns={5} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FemaleIcon sx={{ color: '#E91E63' }} />
                {translations.sections.female}
              </Typography>
              <TableSkeleton rows={6} columns={5} />
            </Grid>
          </Grid>
        )
      ) : viewMode === 'combined' ? (
        <ParticipantsTable
          participants={participants}
          deletedParticipants={deletedParticipants}
          showDeleted={showDeleted}
          showUserHistory={showUserHistory}
          onDelete={handleDelete}
          onRestore={handleRestore}
          onAddBeer={handleAddBeer}
          onAddSpilledBeer={handleAddSpilledBeer}
          onRemoveBeer={handleRemoveBeer}
          onShowHistory={openHistory}
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
              showUserHistory={showUserHistory}
              onDelete={handleDelete}
              onRestore={handleRestore}
              onAddBeer={handleAddBeer}
              onAddSpilledBeer={handleAddSpilledBeer}
              onRemoveBeer={handleRemoveBeer}
              onShowHistory={openHistory}
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
              showUserHistory={showUserHistory}
              onDelete={handleDelete}
              onRestore={handleRestore}
              onAddBeer={handleAddBeer}
              onAddSpilledBeer={handleAddSpilledBeer}
              onRemoveBeer={handleRemoveBeer}
              onShowHistory={openHistory}
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

      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Historie piv: {historyUsername}</DialogTitle>
        <DialogContent dividers>
          {historyLoading ? (
            <CircularProgress size={24} />
          ) : historyBeers.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Žádná data
            </Typography>
          ) : (
            <List dense>
              {historyBeers.map((b, idx) => (
                <React.Fragment key={b.id}>
                  <ListItem>
                    <ListItemText
                      primary={new Date(b.consumedAt).toLocaleString('cs-CZ')}
                    />
                  </ListItem>
                  {idx < historyBeers.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ParticipantsPage; 