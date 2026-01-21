import React, { useMemo, useState } from 'react';
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
  Paper,
} from '@mui/material';
import { 
  Add as AddIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
} from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import { BarrelsTable } from './BarrelsTable';
import { ActiveBarrelGraph } from './ActiveBarrelGraph';
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
import { tokens } from '../../../theme/tokens';
import { useDashboardHeaderSlots } from '../../../contexts/DashboardChromeContext';

const BarrelsPage: React.FC = () => {
  const [showDeleted, setShowDeleted] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'split'>('split');
  const showDeletedFeature = useFeatureFlag(FeatureFlagKey.SHOW_DELETED_BARRELS);
  const canToggleStatus = useFeatureFlag(FeatureFlagKey.BARREL_STATUS_TOGGLE);
  const showEventHistory =
    useFeatureFlag(FeatureFlagKey.SHOW_EVENT_HISTORY) ||
    useFeatureFlag(FeatureFlagKey.SHOW_BARRELS_HISTORY);
  const { activeEvent } = useActiveEvent();
  const showCleanupFeature = useFeatureFlag(FeatureFlagKey.CLEANUP_FUNCTIONALITY);
  const {
    barrels,
    deletedBarrels,
    isLoading,
    handleDelete,
    handleToggleActive,
    fetchBarrels,
  } = useBarrels(showDeleted, activeEvent?.id);
  const toast = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);

  // Get active barrel
  const activeBarrel = barrels.find(barrel => barrel.isActive);

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
            <ToggleButton value="list">
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
      ) : undefined,
    [
      activeEvent?.id,
      viewMode,
      showDeletedFeature,
      showDeleted,
      showCleanupFeature,
      confirmCleanup,
      translations.actions.showDeleted,
      translations.actions.addBarrel,
      translations.actions.cleanupAll,
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
        <CircularProgress />
      ) : viewMode === 'list' ? (
        <BarrelsTable
          barrels={barrels}
          deletedBarrels={deletedBarrels}
          showDeleted={showDeleted}
          onDelete={handleDelete}
          onActivate={handleToggleActive}
          canToggleStatus={canToggleStatus}
        />
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 1 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {activeBarrel 
                  ? `Aktivní sud: #${activeBarrel.orderNumber}`
                  : 'Žádný aktivní sud'}
              </Typography>
              <ActiveBarrelGraph barrel={activeBarrel} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={7}>
            <BarrelsTable
              barrels={barrels}
              deletedBarrels={deletedBarrels}
              showDeleted={showDeleted}
              onDelete={handleDelete}
              onActivate={handleToggleActive}
              canToggleStatus={canToggleStatus}
            />
          </Grid>
        </Grid>
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