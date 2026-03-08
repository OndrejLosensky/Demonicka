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
import { useTranslations } from '../../../contexts/LocaleContext';
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
  const t = useTranslations<Record<string, unknown>>('dashboard.barrels');
  const toastT = useTranslations<Record<string, Record<string, string>>>('toasts');
  const dialogs = (t.dialogs as Record<string, Record<string, string>>) || {};
  const actions = (t.actions as Record<string, string>) || {};
  const emptyState = (t.emptyState as Record<string, string>) || {};
  const cleanupAll = (dialogs.cleanupAll as Record<string, string>) || {};
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
    if (window.confirm(cleanupAll.message)) {
      try {
        await barrelService.cleanup();
        toast.success(cleanupAll.success);
        await fetchBarrels();
      } catch (err) {
        console.error('Failed to cleanup barrels:', err);
        toast.error((toastT.error as Record<string, string>)?.unknown ?? 'Něco se pokazilo');
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
              label={actions.showDeleted}
            />
          )}
          <Button
            variant="contained"
            color="error"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            {actions.addBarrel}
          </Button>
          {showCleanupFeature && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={confirmCleanup}
            >
              {actions.cleanupAll}
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
      actions.showDeleted,
      actions.addBarrel,
      actions.cleanupAll,
    ],
  );

  useDashboardHeaderSlots({ left: headerLeft, action: headerAction });

  if (!activeEvent) {
    return (
      <Container>
        <EmptyEventState
          title={emptyState.title}
          subtitle={emptyState.subtitle}
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
                  ? `${(t.table as Record<string, Record<string, string>>)?.status?.active ?? 'Aktivní'} sud: #${activeBarrel.orderNumber}`
                  : ((t.emptyState as Record<string, string>)?.noActiveBarrel) ?? 'Žádný aktivní sud'}
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