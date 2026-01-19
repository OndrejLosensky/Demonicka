import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { UsersTable } from './UsersTable';
import { useUsers } from './useUsers';
import { AddUserDialog } from './AddUserDialog';
import { useFeatureFlag } from '../../../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../../../types/featureFlags';
import { EventSelector } from '../../../components/EventSelector';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import translations from '../../../locales/cs/dashboard.users.json';
import { withPageLoader } from '../../../components/hoc/withPageLoader';
import { useDashboardHeaderSlots } from '../../../contexts/DashboardChromeContext';

const UsersPage: React.FC = () => {
  const [showDeleted, setShowDeleted] = useState(false);
  const showDeletedFeature = useFeatureFlag(FeatureFlagKey.SHOW_DELETED_USERS);
  const showEventHistory = useFeatureFlag(FeatureFlagKey.SHOW_USER_HISTORY);
  const { activeEvent } = useActiveEvent();
  const {
    users,
    deletedUsers,
    isLoading,
    handleDelete,
    handleAddBeer,
    handleRemoveBeer,
    handleCleanup,
    fetchUsers,
  } = useUsers(showDeleted);

  const [dialogOpen, setDialogOpen] = useState(false);

  // Force refresh when active event changes
  useEffect(() => {
    fetchUsers();
  }, [activeEvent?.id, activeEvent?.updatedAt, fetchUsers]);

  const { maleUsers, femaleUsers } = useMemo(() => {
    const activeUsers = showDeleted ? [...users, ...deletedUsers] : users;
    return {
      maleUsers: activeUsers.filter(p => p.gender === 'MALE'),
      femaleUsers: activeUsers.filter(p => p.gender === 'FEMALE')
    };
  }, [users, deletedUsers, showDeleted]);

  const confirmCleanup = useCallback(async () => {
    if (window.confirm(translations.dialogs.cleanupAll.message)) {
      await handleCleanup();
    }
  }, [handleCleanup, translations.dialogs.cleanupAll.message]);

  const headerLeft = useMemo(
    () => (showEventHistory && activeEvent ? <EventSelector /> : undefined),
    [showEventHistory, activeEvent?.id],
  );

  const headerAction = useMemo(
    () => (
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
          {translations.actions.addUser}
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
    ),
    [showDeletedFeature, showDeleted, confirmCleanup, translations.actions.addUser, translations.actions.cleanupAll, translations.actions.showDeleted],
  );

  useDashboardHeaderSlots({
    left: headerLeft,
    action: headerAction,
  });

  if (isLoading) {
    return null; // withPageLoader will handle loading state
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            {translations.sections.men}
          </Typography>
          <UsersTable
            users={maleUsers}
            onAddBeer={handleAddBeer}
            onRemoveBeer={handleRemoveBeer}
            onDelete={handleDelete}
            showGender={false}
            showDeletedStatus={showDeleted}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            {translations.sections.women}
          </Typography>
          <UsersTable
            users={femaleUsers}
            onAddBeer={handleAddBeer}
            onRemoveBeer={handleRemoveBeer}
            onDelete={handleDelete}
            showGender={false}
            showDeletedStatus={showDeleted}
          />
        </Grid>
      </Grid>

      <AddUserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={fetchUsers}
        existingNames={users.map(u => u.name)}
      />
    </Box>
  );
};

const UsersPageWithLoader = withPageLoader(UsersPage);
export default UsersPageWithLoader;