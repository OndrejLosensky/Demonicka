import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
} from '@mui/material';
import { LOG_LEVELS } from './useHistory';
import { toast } from 'react-hot-toast';
import { historyApi, type CleanupOptions } from './api';
import { useTranslations } from '../../../contexts/LocaleContext';

interface CleanupDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CleanupDialog: React.FC<CleanupDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const t = useTranslations<Record<string, unknown>>('dashboard.history');
  const cleanupLogs = (t.cleanupLogs as Record<string, unknown>) || {};
  const dialog = (cleanupLogs.dialog as Record<string, string>) || {};
  const [olderThan, setOlderThan] = useState<string>('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCleanup = async () => {
    try {
      setIsLoading(true);
      const options: CleanupOptions = {
        ...(olderThan && { endDate: new Date(olderThan) }),
        ...(selectedLevels.length > 0 && { levels: selectedLevels }),
      };

      const result = await historyApi.cleanup(options);
      toast.success((dialog.success ?? 'Úspěšně vyčištěno {{count}} logů').replace('{{count}}', result.deletedCount.toString()));
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(dialog.error ?? 'Nepodařilo se vyčistit logy');
      console.error('Failed to cleanup logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{dialog.title ?? 'Vyčistit Logy'}</DialogTitle>
      <DialogContent>
        <Box className="space-y-4 mt-4">
          <TextField
            label={dialog.olderThanLabel ?? 'Smazat logy starší než'}
            type="date"
            value={olderThan}
            onChange={(e) => setOlderThan(e.target.value)}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
          />

          <FormControl fullWidth>
            <InputLabel>{dialog.logLevelsLabel ?? 'Úrovně logů'}</InputLabel>
            <Select
              multiple
              value={selectedLevels}
              onChange={(e) => setSelectedLevels(e.target.value as string[])}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {LOG_LEVELS.map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          {dialog.cancel ?? 'Zrušit'}
        </Button>
        <Button
          onClick={handleCleanup}
          variant="contained"
          color="error"
          disabled={isLoading}
        >
          {isLoading ? (dialog.cleaning ?? 'Čištění...') : (dialog.confirm ?? 'Vyčistit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 