import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
  TextField,
} from '@mui/material';
import {
  DeleteSweep as DeleteSweepIcon,
  Event as EventIcon,
  Warning as WarningIcon,
  CloudUpload as BackupIcon,
  Description as LogsIcon,
  Schedule as RetentionIcon,
} from '@mui/icons-material';
import { CleanupConfirmDialog } from './CleanupConfirmDialog';
import { systemOperationsService } from '../../../../services/systemOperationsService';
import { backupService } from '../../../../services/backupService';
import { websocketService } from '../../../../services/websocketService';
import { toast } from 'react-hot-toast';
import { USER_ROLE } from '@demonicka/shared-types';
import { useTranslations } from '../../../../contexts/LocaleContext';

interface CleanupSectionProps {
  onRefresh?: () => void;
  userRole?: string;
}

type OperationId = 'backup' | 'system' | 'activeEvent' | 'clearAllLogs' | 'logsRetention';

export const CleanupSection: React.FC<CleanupSectionProps> = ({ onRefresh, userRole }) => {
  const t = useTranslations<Record<string, unknown>>('system');
  const backupT = (t.backup as Record<string, string>) || {};
  const toastsT = (t.toasts as Record<string, string>) || {};
  const cleanupT = (t.cleanupSection as Record<string, string>) || {};
  const runButtonLabel = backupT.runButton ?? 'Spustit zálohu';

  const OPERATION_LABELS: Record<OperationId, string> = {
    backup: runButtonLabel,
    system: cleanupT.operationSystem ?? 'Vyčistit systém',
    activeEvent: cleanupT.operationActiveEvent ?? 'Vyčistit aktivní událost',
    clearAllLogs: cleanupT.operationClearAllLogs ?? 'Smazat všechny logy',
    logsRetention: cleanupT.operationLogsRetention ?? 'Smazat staré logy',
  };
  const [logsRetentionDays, setLogsRetentionDays] = useState(14);
  const [isLoading, setIsLoading] = useState<OperationId | null>(null);
  const pendingJobsRef = useRef<Map<string, string>>(new Map());
  const [dialogConfig, setDialogConfig] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
    severity: 'warning' | 'error';
  } | null>(null);

  const isSuperAdmin = userRole === USER_ROLE.SUPER_ADMIN;
  const isOperator = userRole === USER_ROLE.OPERATOR;

  useEffect(() => {
    const handleJobUpdated = (data: { jobId: string; status: string; result?: Record<string, unknown>; error?: string | null }) => {
      const label = pendingJobsRef.current.get(data.jobId);
      if (!label) return;
      if (data.status === 'COMPLETED') {
        const fileName = data.result?.fileName as string | undefined;
        const msg = label === runButtonLabel && fileName
          ? `${toastsT.backupCompleted ?? 'Záloha byla úspěšně vytvořena'}: ${fileName}`
          : label === runButtonLabel
            ? (toastsT.backupCompleted ?? 'Záloha byla úspěšně vytvořena')
            : data.result?.deletedCount != null
              ? (cleanupT.jobCompleted ?? 'Úloha dokončena.').replace('{{label}}', label) + ` (${data.result.deletedCount} souborů)`
              : (cleanupT.jobCompleted ?? 'Úloha dokončena.').replace('{{label}}', label);
        toast.success(msg);
        onRefresh?.();
      } else if (data.status === 'FAILED') {
        const msg = data.error && data.error.length > 120 ? `${data.error.slice(0, 120)}…` : (data.error || `Úloha „${label}“ selhala.`);
        toast.error(msg);
      }
      pendingJobsRef.current.delete(data.jobId);
    };
    websocketService.subscribe('job:updated', handleJobUpdated);
    return () => websocketService.unsubscribe('job:updated', handleJobUpdated);
  }, [onRefresh]);

  const enqueueOperation = async (
    operationId: OperationId,
    apiCall: () => Promise<{ jobId: string }>,
  ) => {
    setIsLoading(operationId);
    try {
      const { jobId } = await apiCall();
      pendingJobsRef.current.set(jobId, OPERATION_LABELS[operationId]);
      toast.success(cleanupT.jobEnqueued ?? 'Úloha zařazena. Stav uvidíte v Úlohy.');
      onRefresh?.();
    } catch (error) {
      console.error(`${operationId} failed:`, error);
      toast.error(cleanupT.jobFailed ?? 'Nepodařilo se zařadit úlohu.');
    } finally {
      setIsLoading(null);
    }
  };

  const openDialog = (
    title: string,
    message: string,
    onConfirm: () => Promise<void>,
    severity: 'warning' | 'error' = 'warning',
  ) => {
    setDialogConfig({
      open: true,
      title,
      message,
      onConfirm,
      severity,
    });
  };

  const closeDialog = () => {
    setDialogConfig(null);
  };

  const operations = [
    {
      id: 'backup' as const,
      title: cleanupT.operationBackup ?? 'Záloha databáze',
      description: cleanupT.operationBackupDesc ?? 'Vytvořit zálohu databáze a nahrát ji do úložiště.',
      icon: <BackupIcon />,
      color: 'primary' as const,
      severity: 'warning' as const,
      action: () => enqueueOperation('backup', () => backupService.run()),
    },
    {
      id: 'system' as const,
      title: cleanupT.operationSystem ?? 'Vyčistit systém',
      description: cleanupT.operationSystemDesc ?? 'Smazat staré logy a dočasné soubory',
      icon: <DeleteSweepIcon />,
      color: 'primary' as const,
      severity: 'warning' as const,
      action: () => openDialog(
        cleanupT.dialogSystemTitle ?? 'Vyčistit systém',
        cleanupT.dialogSystemMessage ?? 'Tato akce smaže staré logy a dočasné soubory starší než 30 dní.',
        () => enqueueOperation('system', systemOperationsService.cleanupSystem),
        'warning',
      ),
    },
    {
      id: 'activeEvent' as const,
      title: cleanupT.operationActiveEvent ?? 'Vyčistit aktivní událost',
      description: cleanupT.operationActiveEventDesc ?? 'Smazat všechna data aktivní události',
      icon: <EventIcon />,
      color: 'warning' as const,
      severity: 'warning' as const,
      action: () => openDialog(
        cleanupT.dialogActiveEventTitle ?? 'Vyčistit aktivní událost',
        cleanupT.dialogActiveEventMessage ?? 'Tato akce smaže všechna data související s aktuální aktivní událostí. Tato operace je nevratná!',
        () => enqueueOperation('activeEvent', systemOperationsService.cleanupActiveEvent),
        'warning',
      ),
    },
    {
      id: 'clearAllLogs' as const,
      title: cleanupT.operationClearAllLogs ?? 'Smazat všechny logy',
      description: cleanupT.operationClearAllLogsDesc ?? 'Smazat všechny soubory logů (backend, web, mobile)',
      icon: <LogsIcon />,
      color: 'error' as const,
      severity: 'error' as const,
      action: () => openDialog(
        cleanupT.dialogClearAllLogsTitle ?? 'Smazat všechny logy',
        cleanupT.dialogClearAllLogsMessage ?? 'Tato akce smaže všechny soubory logů bez ohledu na stáří. Tato operace je nevratná!',
        () => enqueueOperation('clearAllLogs', systemOperationsService.clearAllLogs),
        'error',
      ),
    },
    {
      id: 'logsRetention' as const,
      title: cleanupT.operationLogsRetention ?? 'Smazat staré logy (retence)',
      description: cleanupT.operationLogsRetentionDesc ?? 'Smazat soubory logů starší než zadaný počet dní (1–365).',
      icon: <RetentionIcon />,
      color: 'primary' as const,
      severity: 'warning' as const,
      action: () => openDialog(
        cleanupT.dialogLogsRetentionTitle ?? 'Smazat staré logy',
        (cleanupT.dialogLogsRetentionMessage ?? 'Tato akce smaže všechny soubory logů starší než {{days}} dní. Úloha se zařadí do fronty. Pokračovat?').replace('{{days}}', String(logsRetentionDays)),
        () => enqueueOperation('logsRetention', () => systemOperationsService.logsRetention(logsRetentionDays)),
        'warning',
      ),
    },
  ];

  const visibleOperations = operations.filter(() => isSuperAdmin || isOperator);

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        {cleanupT.title ?? 'Systémové operace'}
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>{cleanupT.warningTitle ?? 'Upozornění:'}</strong> {cleanupT.warningText ?? 'Operace „Vyčistit aktivní událost" je nevratná. Před provedením se ujistěte, že máte zálohu důležitých dat.'}
        </Typography>
      </Alert>

      <Grid container spacing={2}>
        {visibleOperations.map((option) => (
          <Grid item xs={12} sm={6} md={4} key={option.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #ff9800',
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Box color={`${option.color}.main`}>
                    {option.icon}
                  </Box>
                  <Typography variant="h6" component="h3">
                    {option.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {option.description}
                </Typography>
                {option.id === 'logsRetention' && (
                  <TextField
                    type="number"
                    size="small"
                    value={logsRetentionDays}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!Number.isNaN(v)) setLogsRetentionDays(Math.min(365, Math.max(1, v)));
                    }}
                    inputProps={{ min: 1, max: 365 }}
                    label={cleanupT.retentionDaysLabel ?? 'Počet dní'}
                    sx={{ mt: 2, width: '100%' }}
                  />
                )}
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  color={option.color}
                  fullWidth
                  onClick={option.action}
                  disabled={isLoading === option.id}
                  startIcon={option.icon}
                >
                  {isLoading === option.id ? (cleanupT.buttonRunning ?? 'Probíhá...') : option.id === 'backup' ? runButtonLabel : option.id === 'logsRetention' ? (cleanupT.runLogsRetention ?? `Smazat logy starší než ${logsRetentionDays} dní`) : option.title}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {dialogConfig && (
        <CleanupConfirmDialog
          open={dialogConfig.open}
          onClose={closeDialog}
          onConfirm={dialogConfig.onConfirm}
          title={dialogConfig.title}
          message={dialogConfig.message}
          severity={dialogConfig.severity}
          isLoading={isLoading !== null}
        />
      )}
    </Box>
  );
};
