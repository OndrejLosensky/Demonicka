import React, { useState } from 'react';
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
import { BarrelsTable } from './BarrelsTable';
import { useBarrels } from './useBarrels';
import { AddBarrelDialog } from './AddBarrelDialog';
import { useFeatureFlag } from '../../../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../../../types/featureFlags';
import { EventSelector } from '../../../components/EventSelector';
import { EmptyEventState } from '../../../components/EmptyEventState';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { barrelService } from '../../../services/barrelService';
import { toast } from 'react-hot-toast';
import translations from '../../../locales/cs/dashboard.barrels.json';

const BarrelsPage: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const { activeEvent } = useActiveEvent();
  const showEventHistory = useFeatureFlag(FeatureFlagKey.SHOW_EVENT_HISTORY);
  const showDeletedFeature = useFeatureFlag(FeatureFlagKey.SHOW_DELETED_BARRELS);
  const { barrels, deletedBarrels, isLoading, fetchBarrels } = useBarrels(showDeleted);

  const handleDelete = async (id: string) => {
    try {
      await barrelService.delete(id);
      toast.success(translations.dialogs.delete.success);
      await fetchBarrels();
    } catch (error) {
      console.error('Failed to delete barrel:', error);
      toast.error(translations.dialogs.delete.error);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await barrelService.activate(id);
      toast.success(translations.errors.statusUpdated);
      await fetchBarrels();
    } catch (error) {
      console.error('Failed to activate barrel:', error);
      toast.error(translations.errors.toggleStatusFailed);
    }
  };

  const confirmCleanup = async () => {
    if (window.confirm(translations.dialogs.cleanupAll.message)) {
      try {
        await barrelService.cleanup();
        toast.success(translations.dialogs.cleanupAll.success);
        await fetchBarrels();
      } catch (error) {
        console.error('Failed to cleanup barrels:', error);
        toast.error(translations.dialogs.cleanupAll.error);
      }
    }
  };

  if (!activeEvent) {
    return (
      <Container>
        <EmptyEventState
          title={translations.noData}
          subtitle={translations.noActiveEvent.subtitle}
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
            {translations.actions.addBarrel}
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
        <BarrelsTable
          barrels={barrels}
          deletedBarrels={deletedBarrels}
          showDeleted={showDeleted}
          onDelete={handleDelete}
          onActivate={handleActivate}
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