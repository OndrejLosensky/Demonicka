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
import translations from '../../../locales/cs/dashboard.participants.json';
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
      setUsernameError(translations.dialogs.add.validation.required);
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
          success: translations.dialogs.add.success,
          error: (err) => {
            const msg = notify.fromError(err);
            return msg === 'Něco se pokazilo' ? translations.dialogs.add.error : msg;
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
    } catch (error) {
      console.error('Failed to add user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{translations.dialogs.add.title}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              autoFocus
              label={translations.dialogs.add.fields.username.label}
              value={username}
              onChange={handleUsernameChange}
              error={!!usernameError}
              helperText={usernameError}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>{translations.dialogs.add.fields.gender.label}</InputLabel>
              <Select
                value={gender}
                label={translations.dialogs.add.fields.gender.label}
                onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE')}
              >
                <MenuItem value="MALE">{translations.dialogs.add.fields.gender.male}</MenuItem>
                <MenuItem value="FEMALE">{translations.dialogs.add.fields.gender.female}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{translations.dialogs.add.buttons.cancel}</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting || !!usernameError}
          >
            {translations.dialogs.add.buttons.confirm}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}; 