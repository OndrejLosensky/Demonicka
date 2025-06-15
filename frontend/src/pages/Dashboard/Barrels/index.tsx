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
import { useToast } from '../../../hooks/useToast';
import translations from '../../../locales/cs/dashboard.barrels.json';
import toastTranslations from '../../../locales/cs/toasts.json';
import { withPageLoader } from '../../../components/hoc/withPageLoader';

const BarrelsPage: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const { activeEvent } = useActiveEvent();
  const showEventHistory = useFeatureFlag(FeatureFlagKey.SHOW_EVENT_HISTORY);
  const showDeletedFeature = useFeatureFlag(FeatureFlagKey.SHOW_DELETED_BARRELS);
  const showCleanupFeature = useFeatureFlag(FeatureFlagKey.CLEANUP_FUNCTIONALITY);
  const { barrels, deletedBarrels, isLoading, fetchBarrels } = useBarrels(showDeleted);
  const toast = useToast();

  const handleDelete = async (id: string) => {
    try {
      await barrelService.delete(id);
      toast.success(toastTranslations.success.deleted.replace('{{item}}', 'Sud'));
      await fetchBarrels();
    } catch (error) {
      console.error('Failed to delete barrel:', error);
      toast.error(toastTranslations.error.delete.replace('{{item}}', 'sud'));
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await barrelService.activate(id);
      toast.success(toastTranslations.success.updated.replace('{{item}}', 'Sud'));
      await fetchBarrels();
    } catch (error) {
      console.error('Failed to activate barrel:', error);
      toast.error(toastTranslations.error.update.replace('{{item}}', 'sud'));
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
        toast.error(toastTranslations.error.unknown);
      }
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
            {translations.actions.addBarrel}
          </Button>
          {showCleanupFeature && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={confirmCleanup}
            >
              {translations.actions.cleanupAll}
            </Button>
          )}
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

const Barrels = withPageLoader(BarrelsPage);
export default Barrels; 