import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CloudUpload as BackupIcon } from '@mui/icons-material';
import { jobConfigService, type JobConfigResponse } from '../../../../services/jobConfigService';
import { backupService } from '../../../../services/backupService';
import { useToast } from '../../../../hooks/useToast';

const BACKUP_ENABLED_KEY = 'backup.enabled';
const BACKUP_INTERVAL_HOURS_KEY = 'backup.intervalHours';

const INTERVAL_OPTIONS = [
  { value: 1, label: '1 hodina' },
  { value: 6, label: '6 hodin' },
  { value: 12, label: '12 hodin' },
  { value: 24, label: '24 hodin' },
];

export const BackupJobSettings: React.FC = () => {
  const toast = useToast();
  const [config, setConfig] = useState<JobConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [runningBackup, setRunningBackup] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await jobConfigService.get();
      setConfig(data);
    } catch (err) {
      console.error('Failed to load job config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleEnabledChange = async (checked: boolean) => {
    if (!config) return;
    setSaving(true);
    try {
      await jobConfigService.patch({ [BACKUP_ENABLED_KEY]: checked });
      setConfig((c) => (c ? { ...c, [BACKUP_ENABLED_KEY]: checked } : null));
      toast.success(checked ? 'Plánovaná záloha zapnuta.' : 'Plánovaná záloha vypnuta.');
    } catch (err) {
      console.error('Failed to save backup enabled:', err);
      toast.error('Nepodařilo se uložit nastavení.');
    } finally {
      setSaving(false);
    }
  };

  const handleIntervalChange = async (hours: number) => {
    if (!config) return;
    setSaving(true);
    try {
      await jobConfigService.patch({ [BACKUP_INTERVAL_HOURS_KEY]: hours });
      setConfig((c) => (c ? { ...c, [BACKUP_INTERVAL_HOURS_KEY]: hours } : null));
      toast.success(`Interval zálohy nastaven na ${hours} h.`);
    } catch (err) {
      console.error('Failed to save backup interval:', err);
      toast.error('Nepodařilo se uložit nastavení.');
    } finally {
      setSaving(false);
    }
  };

  const handleRunBackup = async () => {
    setRunningBackup(true);
    try {
      await backupService.run();
      toast.success('Záloha byla zařazena. Stav uvidíte v Úlohy.');
    } catch (err) {
      console.error('Failed to run backup:', err);
      toast.error('Nepodařilo se spustit zálohu.');
    } finally {
      setRunningBackup(false);
    }
  };

  if (loading || !config) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Plánovaná záloha databáze
      </Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        Plánovaná záloha se spouští automaticky v nastaveném intervalu. Ruční zálohu lze spustit zde nebo na stránce Operace.
      </Alert>
      <Box display="flex" flexDirection="column" gap={2} maxWidth={400}>
        <FormControlLabel
          control={
            <Switch
              checked={config[BACKUP_ENABLED_KEY]}
              onChange={(_, checked) => handleEnabledChange(checked)}
              disabled={saving}
            />
          }
          label="Zapnout plánovanou zálohu"
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Interval zálohy</InputLabel>
          <Select
            value={config[BACKUP_INTERVAL_HOURS_KEY]}
            label="Interval zálohy"
            onChange={(e) => handleIntervalChange(Number(e.target.value))}
            disabled={saving}
          >
            {INTERVAL_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          startIcon={<BackupIcon />}
          onClick={handleRunBackup}
          disabled={runningBackup}
          sx={{ alignSelf: 'flex-start' }}
        >
          {runningBackup ? 'Spouštím…' : 'Spustit zálohu nyní'}
        </Button>
      </Box>
    </Box>
  );
};
