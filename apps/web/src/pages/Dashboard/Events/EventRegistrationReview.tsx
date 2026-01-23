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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@demonicka/ui';
import {
  Save as SaveIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  GetApp as DownloadIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { eventRegistrationService, type EventRegistration, type ImportResult } from '../../../services/eventRegistrationService';
import { userService } from '../../../services/userService';
import type { User } from '@demonicka/shared-types';
import { toast } from 'react-hot-toast';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useDashboardHeaderSlots } from '../../../contexts/DashboardChromeContext';
import { eventService } from '../../../services/eventService';

export const EventRegistrationReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [eventName, setEventName] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<EventRegistration>>({});

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const [regs, users, event] = await Promise.all([
        eventRegistrationService.getRegistrationsWithSuggestions(id),
        userService.getAllUsers(false),
        eventService.getEvent(id),
      ]);
      setRegistrations(regs);
      setAllUsers(users);
      setEventName(event.name);
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

  const safeFileName = (base: string): string => {
    const trimmed = base.trim() || 'export';
    const sanitized = trimmed.replace(/[^a-zA-Z0-9._-]+/g, '_');
    return sanitized.replace(/^_+|_+$/g, '') || 'export';
  };

  const handleExport = useCallback(async () => {
    if (!id) return;

    try {
      setIsExporting(true);
      const blob = await eventRegistrationService.exportRegistrations(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeFileName(`${eventName || 'registrace'}_registrace`)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Excel export stažen');
    } catch (error) {
      console.error('Failed to export registrations:', error);
      toast.error('Nepodařilo se exportovat registrace');
    } finally {
      setIsExporting(false);
    }
  }, [id, eventName]);

  const handleImportClick = () => {
    setImportDialogOpen(true);
    setImportResult(null);
  };

  const handleImportFile = async (file: File | null) => {
    if (!id || !file) return;

    if (!file.name.endsWith('.xlsx')) {
      toast.error('Soubor musí být ve formátu Excel (.xlsx)');
      return;
    }

    try {
      setIsImporting(true);
      const result = await eventRegistrationService.importRegistrations(id, file);
      setImportResult(result);
      
      if (result.errors.length === 0) {
        toast.success(`Úspěšně importováno ${result.created} registrací`);
        await loadData();
      } else {
        toast.warning(`Importován ${result.created} registrací, ${result.errors.length} chyb`);
      }
    } catch (error: any) {
      console.error('Failed to import registrations:', error);
      toast.error(error.response?.data?.message || 'Nepodařilo se importovat registrace');
    } finally {
      setIsImporting(false);
    }
  };

  const headerAction = useMemo(
    () => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={isExporting || registrations.length === 0}
        >
          {isExporting ? 'Exportuji…' : 'Exportovat do Excel'}
        </Button>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={handleImportClick}
          disabled={isImporting}
        >
          Importovat z Excel
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CheckIcon />}
          onClick={handleApply}
          disabled={isApplying || registrations.filter((r) => r.status === 'APPROVED' && r.matchedUserId).length === 0}
        >
          {isApplying ? 'Aplikuji…' : 'Aplikovat schválené registrace'}
        </Button>
      </Box>
    ),
    [handleApply, handleExport, isApplying, isExporting, isImporting, registrations],
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

        {/* Import Dialog */}
        <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Importovat registrace z Excel</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImportFile(file);
                  }
                }}
                style={{ display: 'none' }}
                id="import-file-input"
                disabled={isImporting}
              />
              <label htmlFor="import-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  disabled={isImporting}
                  fullWidth
                >
                  {isImporting ? 'Nahrávám…' : 'Vybrat Excel soubor'}
                </Button>
              </label>

              {importResult && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Výsledky importu
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Úspěšně importováno: <strong>{importResult.created}</strong> registrací
                  </Typography>
                  
                  {importResult.errors.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Chyby ({importResult.errors.length}):
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Řádek</TableCell>
                              <TableCell>Pole</TableCell>
                              <TableCell>Chyba</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {importResult.errors.map((error, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{error.row}</TableCell>
                                <TableCell>{error.field}</TableCell>
                                <TableCell>{error.error}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setImportDialogOpen(false);
              setImportResult(null);
            }}>
              Zavřít
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};
