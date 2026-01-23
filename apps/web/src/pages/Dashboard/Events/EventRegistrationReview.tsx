import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  Chip,
  LinearProgress,
} from '@demonicka/ui';
import {
  Save as SaveIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { eventRegistrationService, type EventRegistration } from '../../../services/eventRegistrationService';
import { userService } from '../../../services/userService';
import type { User } from '@demonicka/shared-types';
import { toast } from 'react-hot-toast';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useDashboardHeaderSlots } from '../../../contexts/DashboardChromeContext';

export const EventRegistrationReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<EventRegistration>>({});

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const [regs, users] = await Promise.all([
        eventRegistrationService.getRegistrationsWithSuggestions(id),
        userService.getAllUsers(false),
      ]);
      setRegistrations(regs);
      setAllUsers(users);
    } catch (error) {
      console.error('Failed to load registrations:', error);
      toast.error('Nepodařilo se načíst registrace');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateRegistration = async (registrationId: string, data: Partial<EventRegistration>) => {
    if (!id) return;

    try {
      await eventRegistrationService.updateRegistration(id, registrationId, {
        matchedUserId: data.matchedUserId,
        arrivalTime: data.arrivalTime,
        leaveTime: data.leaveTime,
        status: data.status,
      });
      toast.success('Registrace aktualizována');
      setEditingId(null);
      setEditData({});
      loadData();
    } catch (error) {
      console.error('Failed to update registration:', error);
      toast.error('Nepodařilo se aktualizovat registraci');
    }
  };

  const handleStartEdit = (reg: EventRegistration) => {
    setEditingId(reg.id);
    setEditData({
      // Auto-select suggested match if no user is already matched
      matchedUserId: reg.matchedUserId || reg.suggestedMatch?.id || undefined,
      arrivalTime: reg.arrivalTime,
      leaveTime: reg.leaveTime,
      status: reg.status,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleApply = useCallback(async () => {
    if (!id) return;

    try {
      setIsApplying(true);
      const result = await eventRegistrationService.applyRegistrations(id);
      toast.success(`Bylo přidáno ${result.applied} uživatelů do události`);
      loadData();
    } catch (error) {
      console.error('Failed to apply registrations:', error);
      toast.error('Nepodařilo se aplikovat registrace');
    } finally {
      setIsApplying(false);
    }
  }, [id, loadData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Schváleno';
      case 'REJECTED':
        return 'Zamítnuto';
      default:
        return 'Čeká';
    }
  };

  const getUserDisplayName = (user?: Pick<User, 'name' | 'firstName' | 'lastName' | 'username'> | null) => {
    if (!user) return '-';
    if (user.name) return user.name;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    return user.username ?? '-';
  };

  const headerAction = useMemo(
    () => (
      <Button
        variant="contained"
        color="primary"
        startIcon={<CheckIcon />}
        onClick={handleApply}
        disabled={isApplying || registrations.filter((r) => r.status === 'APPROVED' && r.matchedUserId).length === 0}
      >
        {isApplying ? 'Aplikuji…' : 'Aplikovat schválené registrace'}
      </Button>
    ),
    [handleApply, isApplying, registrations],
  );

  useDashboardHeaderSlots({ action: headerAction });

  if (isLoading) {
    return (
      <Box>
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress />
        </Box>
      </Box>
    );
  }

  return (
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Celkem registrací: {registrations.length}
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Jméno</TableCell>
                <TableCell>Zúčastní se</TableCell>
                <TableCell>Příjezd</TableCell>
                <TableCell>Odjezd</TableCell>
                <TableCell>Párovaný uživatel</TableCell>
                <TableCell>Návrh párování</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Akce</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {registrations.map((reg) => (
                <TableRow key={reg.id}>
                    <TableCell>{reg.rawName}</TableCell>
                    <TableCell>{reg.participating ? 'Ano' : 'Ne'}</TableCell>
                    <TableCell>
                      {editingId === reg.id ? (
                        <DateTimePicker
                          value={reg.arrivalTime ? new Date(reg.arrivalTime) : null}
                          onChange={(newValue) =>
                            setEditData({ ...editData, arrivalTime: newValue?.toISOString() })
                          }
                          slotProps={{
                            textField: { size: 'small', fullWidth: true },
                          }}
                        />
                      ) : reg.arrivalTime ? (
                        format(new Date(reg.arrivalTime), 'PPp', { locale: cs })
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === reg.id ? (
                        <DateTimePicker
                          value={reg.leaveTime ? new Date(reg.leaveTime) : null}
                          onChange={(newValue) =>
                            setEditData({ ...editData, leaveTime: newValue?.toISOString() })
                          }
                          slotProps={{
                            textField: { size: 'small', fullWidth: true },
                          }}
                        />
                      ) : reg.leaveTime ? (
                        format(new Date(reg.leaveTime), 'PPp', { locale: cs })
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === reg.id ? (
                        <FormControl fullWidth size="small">
                          <Select
                            value={editData.matchedUserId || ''}
                            onChange={(e) =>
                              setEditData({ ...editData, matchedUserId: e.target.value || undefined })
                            }
                          >
                            <MenuItem value="">Žádný</MenuItem>
                            {allUsers.map((user) => (
                              <MenuItem key={user.id} value={user.id}>
                                {getUserDisplayName(user)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : reg.matchedUser ? (
                        getUserDisplayName(reg.matchedUser)
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {reg.suggestedMatch ? (
                        <Box>
                          <Typography variant="body2">{getUserDisplayName(reg.suggestedMatch)}</Typography>
                          {reg.suggestedConfidence !== undefined && (
                            <Typography variant="caption" color="text.secondary">
                              {(reg.suggestedConfidence * 100).toFixed(0)}%
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === reg.id ? (
                        <FormControl fullWidth size="small">
                          <Select
                            value={editData.status || 'PENDING'}
                            onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}
                          >
                            <MenuItem value="PENDING">Čeká</MenuItem>
                            <MenuItem value="APPROVED">Schváleno</MenuItem>
                            <MenuItem value="REJECTED">Zamítnuto</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <Chip
                          label={getStatusLabel(reg.status)}
                          color={getStatusColor(reg.status) as any}
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === reg.id ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleUpdateRegistration(reg.id, editData)}
                          >
                            <SaveIcon />
                          </IconButton>
                          <IconButton size="small" onClick={handleCancelEdit}>
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Button size="small" onClick={() => handleStartEdit(reg)}>
                          Upravit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </TableContainer>
      </Box>
  );
};
