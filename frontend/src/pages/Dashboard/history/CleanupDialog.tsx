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
import { historyApi } from './api';

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
  const [olderThan, setOlderThan] = useState<string>('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCleanup = async () => {
    try {
      setIsLoading(true);
      const options = {
        ...(olderThan && { olderThan: new Date(olderThan) }),
        ...(selectedLevels.length > 0 && { levels: selectedLevels }),
      };

      const result = await historyApi.cleanup(options);
      toast.success(`Successfully cleaned up ${result.deletedCount} log files`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to cleanup logs');
      console.error('Failed to cleanup logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Clean Up Logs</DialogTitle>
      <DialogContent>
        <Box className="space-y-4 mt-4">
          <TextField
            label="Delete Logs Older Than"
            type="date"
            value={olderThan}
            onChange={(e) => setOlderThan(e.target.value)}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
          />

          <FormControl fullWidth>
            <InputLabel>Log Levels</InputLabel>
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
          Cancel
        </Button>
        <Button
          onClick={handleCleanup}
          variant="contained"
          color="error"
          disabled={isLoading}
        >
          {isLoading ? 'Cleaning...' : 'Clean Up'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 