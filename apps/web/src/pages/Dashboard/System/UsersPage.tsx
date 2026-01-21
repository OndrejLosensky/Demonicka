import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  RestoreFromTrash as RestoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { systemService, type SystemStats } from '../../../services/systemService';
import { userService } from '../../../services/userService';
import { useToast } from '../../../hooks/useToast';
import translations from '../../../locales/cs/system.json';
import { MetricCard } from '@demonicka/ui';
import { useFeatureFlag } from '../../../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../../../types/featureFlags';
import type { User, UserRole } from '@demonicka/shared-types';
import { RegistrationTokenDialog } from './components/RegistrationTokenDialog';
import { ChangeUserRoleDialog } from './components/ChangeUserRoleDialog';
import { useAuth } from '../../../contexts/AuthContext';
import { DeleteUserConfirmDialog } from './components/DeleteUserConfirmDialog';

const UsersPage: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingTokenFor, setGeneratingTokenFor] = useState<string | null>(null);
  const canShowDeletedUsers = useFeatureFlag(FeatureFlagKey.SHOW_DELETED_USERS);
  const [showDeletedUsers, setShowDeletedUsers] = useState(false);
  const [deletedUsers, setDeletedUsers] = useState<User[]>([]);
  const [isDeletedUsersLoading, setIsDeletedUsersLoading] = useState(false);
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const isRefreshingRef = useRef(false);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [tokenDialogToken, setTokenDialogToken] = useState<string | null>(null);
  const [tokenDialogUsername, setTokenDialogUsername] = useState<string | null>(
    null,
  );
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleDialogUser, setRoleDialogUser] = useState<{
    id: string;
    username: string | null;
    role: string;
  } | null>(null);
  const [isRoleSaving, setIsRoleSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    username: string | null;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const copyToClipboard = useCallback(
    async (value: string, successMessage: string) => {
      try {
        await navigator.clipboard.writeText(value);
        toast.success(successMessage);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        toast.error(translations.toasts.copyFailed);
      }
    },
    [toast],
  );

  const loadStats = useCallback(async (isInitial = false) => {
    // Prevent multiple simultaneous calls
    if (isRefreshingRef.current && !isInitial) {
      return;
    }
    
    try {
      if (isInitial) {
        setIsInitialLoading(true);
      } else {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
      }
      setError(null);
      const data = await systemService.getSystemStats();
      setStats(data);
      setError(null);
    } catch (error) {
      console.error('Failed to load system stats:', error);
      setError(translations.error.loadFailed);
      // Use toast directly instead of depending on it in useCallback
      toast.error(translations.error.loadFailed);
    } finally {
      if (isInitial) {
        setIsInitialLoading(false);
      } else {
        isRefreshingRef.current = false;
        setIsRefreshing(false);
      }
    }
  }, []); // Remove dependencies to prevent infinite loops

  useEffect(() => {
    loadStats(true);
    
    const interval = setInterval(() => {
      loadStats(false);
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [loadStats]);

  const handleGenerateToken = async (userId: string, username?: string | null) => {
    try {
      setGeneratingTokenFor(userId);
      const response = await userService.generateRegisterToken(userId);
      setTokenDialogToken(response.token);
      setTokenDialogUsername(username ?? null);
      setTokenDialogOpen(true);
      loadStats(false);
    } catch (error) {
      console.error('Failed to generate token:', error);
      toast.error(translations.toasts.tokenGenerationFailed);
    } finally {
      setGeneratingTokenFor(null);
    }
  };

  const handleOpenRoleDialog = (u: { id: string; username: string | null; role: string }) => {
    setRoleDialogUser(u);
    setRoleDialogOpen(true);
  };

  const handleSaveRole = async (role: UserRole) => {
    if (!roleDialogUser) return;
    try {
      setIsRoleSaving(true);
      await userService.updateUserRole(roleDialogUser.id, role);
      toast.success(translations.toasts.roleUpdated);
      setRoleDialogOpen(false);
      setRoleDialogUser(null);
      await loadStats(false);
    } catch (error) {
      console.error('Failed to update user role:', error);
      toast.error(translations.toasts.roleUpdateFailed);
    } finally {
      setIsRoleSaving(false);
    }
  };

  const handleRequestDelete = (u: { id: string; username: string | null }) => {
    setDeleteTarget(u);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await userService.deleteUser(deleteTarget.id);
      toast.success(translations.toasts.userDeleted);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      await Promise.all([
        loadStats(false),
        showDeletedUsers ? loadDeletedUsers() : Promise.resolve(),
      ]);
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error(translations.toasts.userDeleteFailed);
    } finally {
      setIsDeleting(false);
    }
  };

  const loadDeletedUsers = useCallback(async () => {
    try {
      setIsDeletedUsersLoading(true);
      const data = await userService.getDeleted();
      setDeletedUsers(data);
    } catch (error) {
      console.error('Failed to load deleted users:', error);
      toast.error('Nepodařilo se načíst smazané uživatele');
    } finally {
      setIsDeletedUsersLoading(false);
    }
  }, [toast]);

  const handleRestoreUser = useCallback(
    async (userId: string) => {
      try {
        await userService.restoreUser(userId);
        toast.success('Uživatel byl obnoven');
        await Promise.all([loadStats(false), loadDeletedUsers()]);
      } catch (error) {
        console.error('Failed to restore user:', error);
        toast.error('Nepodařilo se obnovit uživatele');
      }
    },
    [loadDeletedUsers, loadStats, toast],
  );

  useEffect(() => {
    if (!canShowDeletedUsers) return;
    if (showDeletedUsers) {
      loadDeletedUsers();
    } else {
      setDeletedUsers([]);
    }
  }, [canShowDeletedUsers, showDeletedUsers, loadDeletedUsers]);

  if (isInitialLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !stats) {
    return (
      <Box textAlign="center" p={4}>
        <Typography color="error" variant="h6" gutterBottom>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => loadStats(true)}
          sx={{ mt: 2 }}
        >
          {translations.error.retry}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Uživatelé
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          {canShowDeletedUsers && (
            <FormControlLabel
              control={
                <Switch
                  checked={showDeletedUsers}
                  onChange={(e) => setShowDeletedUsers(e.target.checked)}
                />
              }
              label="Zobrazit smazané"
            />
          )}
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={() => loadStats(false)}
            disabled={isRefreshing}
          >
            {translations.refresh}
          </Button>
        </Box>
      </Box>

      {stats && (
        <>
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard title={translations.userStatistics.totalUsers} value={stats.totalUsers} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard title={translations.userStatistics.adminUsers} value={stats.totalAdminUsers} color="error" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard title={translations.userStatistics.completedRegistrations} value={stats.totalCompletedRegistrations} color="success" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard title={translations.userStatistics.twoFactorEnabled} value={stats.total2FAEnabled} color="warning" />
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {translations.userList.title}
              </Typography>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{translations.userList.columns.username}</TableCell>
                      <TableCell>{translations.userList.columns.role}</TableCell>
                      <TableCell>{translations.userList.columns.twoFactorStatus}</TableCell>
                      <TableCell>{translations.userList.columns.registrationStatus}</TableCell>
                      <TableCell>{translations.userList.columns.lastAdminLogin}</TableCell>
                      <TableCell align="right">{translations.userList.columns.actions}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {user.username}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={translations.userList.roles[user.role as keyof typeof translations.userList.roles] || user.role}
                            size="small"
                            color={user.role === 'SUPER_ADMIN' ? 'error' : user.role === 'OPERATOR' ? 'warning' : 'primary'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.isTwoFactorEnabled ? translations.userList.twoFactorStatus.enabled : translations.userList.twoFactorStatus.disabled}
                            size="small"
                            color={user.isTwoFactorEnabled ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.isRegistrationComplete ? translations.userList.registrationStatus.complete : translations.userList.registrationStatus.incomplete}
                            size="small"
                            color={user.isRegistrationComplete ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {user.lastAdminLogin ? new Date(user.lastAdminLogin).toLocaleString('cs-CZ') : 'Nikdy'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title={translations.userList.actions.editRole}>
                            <span>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleOpenRoleDialog({
                                    id: user.id,
                                    username: user.username ?? null,
                                    role: user.role,
                                  })
                                }
                                disabled={
                                  currentUser?.role === 'OPERATOR' &&
                                  user.role === 'SUPER_ADMIN'
                                }
                                color="inherit"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          {currentUser?.role === 'SUPER_ADMIN' && (
                            <Tooltip title={translations.userList.actions.deleteUser}>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleRequestDelete({
                                    id: user.id,
                                    username: user.username ?? null,
                                  })
                                }
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {!user.isRegistrationComplete && (
                            <Tooltip title={translations.userList.actions.generateToken}>
                              <IconButton
                                size="small"
                                onClick={() => handleGenerateToken(user.id, user.username)}
                                disabled={generatingTokenFor === user.id}
                                color="primary"
                              >
                                <CopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <RegistrationTokenDialog
            open={tokenDialogOpen}
            username={tokenDialogUsername}
            token={tokenDialogToken}
            onClose={() => setTokenDialogOpen(false)}
            onCopy={async (value) => {
              const isUrl =
                value.startsWith('http://') || value.startsWith('https://');
              await copyToClipboard(
                value,
                isUrl ? translations.toasts.urlCopied : translations.toasts.tokenCopied,
              );
            }}
            labels={{
              title: translations.tokenDialog.title,
              tokenLabel: translations.tokenDialog.tokenLabel,
              urlLabel: translations.tokenDialog.urlLabel,
              qrTitle: translations.tokenDialog.qrTitle,
              close: translations.tokenDialog.close,
              copyToken: translations.tokenDialog.copyToken,
              copyUrl: translations.tokenDialog.copyUrl,
            }}
          />

          <ChangeUserRoleDialog
            open={roleDialogOpen}
            username={roleDialogUser?.username ?? null}
            currentRole={roleDialogUser?.role ?? null}
            actorRole={currentUser?.role ?? null}
            isSaving={isRoleSaving}
            onClose={() => {
              if (isRoleSaving) return;
              setRoleDialogOpen(false);
              setRoleDialogUser(null);
            }}
            onSave={(role) => void handleSaveRole(role)}
            labels={{
              title: translations.roleDialog.title,
              roleLabel: translations.roleDialog.roleLabel,
              cancel: translations.roleDialog.cancel,
              save: translations.roleDialog.save,
              helperTextOperator: translations.roleDialog.operatorHint,
            }}
          />

          <DeleteUserConfirmDialog
            open={deleteDialogOpen}
            username={deleteTarget?.username ?? null}
            isLoading={isDeleting}
            onClose={() => {
              if (isDeleting) return;
              setDeleteDialogOpen(false);
              setDeleteTarget(null);
            }}
            onConfirm={() => void handleConfirmDelete()}
            labels={{
              title: translations.deleteDialog.title,
              message: translations.deleteDialog.message,
              cancel: translations.deleteDialog.cancel,
              confirm: translations.deleteDialog.confirm,
            }}
          />

          {canShowDeletedUsers && showDeletedUsers && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Smazaní uživatelé</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadDeletedUsers}
                    disabled={isDeletedUsersLoading}
                    size="small"
                  >
                    Obnovit
                  </Button>
                </Box>

                {isDeletedUsersLoading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress size={24} />
                  </Box>
                ) : deletedUsers.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Žádní smazaní uživatelé
                  </Typography>
                ) : (
                  <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Uživatel</TableCell>
                          <TableCell>Role</TableCell>
                          <TableCell>Smazáno</TableCell>
                          <TableCell align="right">Akce</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {deletedUsers.map((u) => (
                          <TableRow key={u.id} sx={{ opacity: 0.8 }}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {u.username}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={u.role} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {u.deletedAt ? new Date(u.deletedAt).toLocaleString('cs-CZ') : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Obnovit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRestoreUser(u.id)}
                                  sx={{
                                    border: 1,
                                    borderColor: 'success.main',
                                    '&:hover': { bgcolor: 'success.light' },
                                  }}
                                >
                                  <RestoreIcon fontSize="small" sx={{ color: 'success.main' }} />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
};

export { UsersPage };
