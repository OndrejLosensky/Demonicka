import React, { useState, useEffect } from 'react';
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
  Box,
} from '@mui/material';
import { participantsApi } from './api';
import { eventService } from '../../../services/eventService';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { useSelectedEvent } from '../../../contexts/SelectedEventContext';
import { useTranslations } from '../../../contexts/LocaleContext';
import { notify } from '../../../notifications/notify';

interface AddParticipantDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddParticipantDialog: React.FC<AddParticipantDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const { activeEvent, loadActiveEvent } = useActiveEvent();
  const { setSelectedEvent } = useSelectedEvent();
  const t = useTranslations<Record<string, unknown>>('dashboard.participants');
  const dialogs = (t.dialogs as Record<string, Record<string, unknown>>) || {};
  const addDialog = (dialogs.add as Record<string, unknown>) || {};
  const validation = (addDialog.validation as Record<string, string>) || {};
  const fields = (addDialog.fields as Record<string, Record<string, string>>) || {};
  const buttons = (addDialog.buttons as Record<string, string>) || {};

  // Reset form state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setUsername('');
      setGender('MALE');
      setUsernameError('');
    }
  }, [open]);

  // Validate username on change
  const validateUsername = (value: string) => {
    const trimmedUsername = value.trim();
    if (!trimmedUsername) {
      setUsernameError(validation.required ?? 'Povinné pole');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    validateUsername(newUsername);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUsername(username)) {
      return;
    }

    try {
      setIsSubmitting(true);

      const normalizedUsername = username.trim();
      const toastId = `participant:add:${normalizedUsername.toLowerCase()}`;

      await notify.action(
        {
          id: toastId,
          success: (addDialog.success as string) ?? 'Účastník byl přidán',
          error: (err) => {
            const msg = notify.fromError(err);
            return msg === 'Něco se pokazilo' ? (addDialog.error as string) ?? 'Nepodařilo se přidat účastníka' : msg;
          },
        },
        async () => {
          const user = await participantsApi.create({
            username: normalizedUsername,
            gender,
          });

          // If there's an active event, automatically add the user to it
          if (activeEvent) {
            await eventService.addUser(activeEvent.id, user.id);
            await loadActiveEvent(); // Refresh the active event data

            // Force refresh of selected event to ensure users list updates
            const updatedActiveEvent = await eventService.getEvent(activeEvent.id);
            setSelectedEvent(updatedActiveEvent);
          }
        },
      );

      onSuccess(); // This will refresh the users list
      onClose();
    } catch (err) {
      console.error('Failed to add user:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{(addDialog.title as string) ?? 'Přidat účastníka'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              autoFocus
              label={fields.username?.label ?? 'Uživatelské jméno'}
              value={username}
              onChange={handleUsernameChange}
              error={!!usernameError}
              helperText={usernameError}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>{fields.gender?.label ?? 'Pohlaví'}</InputLabel>
              <Select
                value={gender}
                label={fields.gender?.label ?? 'Pohlaví'}
                onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE')}
              >
                <MenuItem value="MALE">{fields.gender?.male ?? 'Muž'}</MenuItem>
                <MenuItem value="FEMALE">{fields.gender?.female ?? 'Žena'}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{buttons.cancel ?? 'Zrušit'}</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting || !!usernameError}
          >
            {buttons.confirm ?? 'Přidat'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}; 