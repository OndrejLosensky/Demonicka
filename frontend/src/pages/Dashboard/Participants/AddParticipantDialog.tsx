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
import { toast } from 'react-hot-toast';
import { participantsApi } from './api';
import { eventService } from '../../../services/eventService';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { useSelectedEvent } from '../../../contexts/SelectedEventContext';
import { AxiosError } from 'axios';
import translations from '../../../locales/cs/dashboard.participants.json';

interface AddParticipantDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingNames: string[];
}

export const AddParticipantDialog: React.FC<AddParticipantDialogProps> = ({
  open,
  onClose,
  onSuccess,
  existingNames,
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

  // Validate username
  const validateUsername = (value: string) => {
    const trimmedUsername = value.trim();
    if (!trimmedUsername) {
      setUsernameError('Uživatelské jméno je povinné');
      return false;
    }
    
    if (trimmedUsername.length < 3) {
      setUsernameError('Uživatelské jméno musí mít alespoň 3 znaky');
      return false;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      setUsernameError('Uživatelské jméno může obsahovat pouze písmena, čísla, podtržítka a pomlčky');
      return false;
    }

    // Case-insensitive username comparison
    const usernameExists = existingNames.some(
      existingName => existingName.toLowerCase() === trimmedUsername.toLowerCase()
    );
    
    if (usernameExists) {
      setUsernameError('Toto uživatelské jméno již existuje');
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
      const participant = await participantsApi.create({ 
        name: username.trim(),
        gender 
      });
      
      // If there's an active event, automatically add the participant to it
      if (activeEvent) {
        await eventService.addUser(activeEvent.id, participant.id);
        await loadActiveEvent(); // Refresh the active event data
        
        // Force refresh of selected event to ensure participants list updates
        const updatedActiveEvent = await eventService.getEvent(activeEvent.id);
        setSelectedEvent(updatedActiveEvent);
      }
      
      toast.success(translations.dialogs.add.success);
      onSuccess(); // This will refresh the participants list
      onClose();
    } catch (error) {
      if ((error as AxiosError)?.response?.status === 409) {
        setUsernameError('Uživatelské jméno již existuje');
        toast.error('Uživatelské jméno již existuje');
      } else {
        console.error('Failed to add participant:', error);
        toast.error(translations.dialogs.add.error);
      }
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
              label="Uživatelské jméno"
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