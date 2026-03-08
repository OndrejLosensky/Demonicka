import { useState, useEffect } from 'react';
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
} from '@mui/material';
import type { AxiosError } from 'axios';
import type { AddUserDialogProps } from './types';
import { userService } from '../../../services/userService';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { useSelectedEvent } from '../../../contexts/SelectedEventContext';
import { eventService } from '../../../services/eventService';
import { useToast } from '../../../hooks/useToast';
import { useTranslations } from '../../../contexts/LocaleContext';

export const AddUserDialog: React.FC<AddUserDialogProps> = ({
  open,
  onClose,
  onSuccess,
  existingNames,
}) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');
  const { activeEvent, loadActiveEvent } = useActiveEvent();
  const { setSelectedEvent } = useSelectedEvent();
  const toast = useToast();
  const t = useTranslations<Record<string, unknown>>('dashboard.users');
  const toastT = useTranslations<Record<string, Record<string, string>>>('toasts');
  const dialogs = (t.dialogs as Record<string, Record<string, unknown>>) || {};
  const addDialog = (dialogs.add as Record<string, unknown>) || {};
  const validation = (addDialog.validation as Record<string, string>) || {};
  const success = toastT.success as Record<string, string> | undefined;
  const toastError = toastT.error as Record<string, string> | undefined;

  // Reset form state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setName('');
      setGender('MALE');
      setNameError('');
    }
  }, [open]);

  // Validate name on change
  const validateName = (value: string) => {
    const trimmedName = value.trim();
    if (!trimmedName) {
      setNameError(validation.required ?? 'Povinné pole');
      return false;
    }
    
    const nameExists = existingNames.some(
      existingName => existingName.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (nameExists) {
      setNameError(validation.firstName ?? 'Uživatel s tímto jménem již existuje');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    validateName(newName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateName(name)) {
      return;
    }

    try {
      setIsSubmitting(true);
      const user = await userService.createUser({ name: name.trim(), gender });
      
      // If there's an active event, automatically add the user to it
      if (activeEvent) {
        await eventService.addUser(activeEvent.id, user.id);
        await loadActiveEvent(); // Refresh the active event data
        
        // Force refresh of selected event to ensure users list updates
        const updatedActiveEvent = await eventService.getEvent(activeEvent.id);
        setSelectedEvent(updatedActiveEvent);
      }
      
      toast.success((success?.created ?? '{{item}} byl úspěšně vytvořen').replace('{{item}}', 'Uživatel'));
      onSuccess(); // This will refresh the users list
      onClose();
    } catch (err) {
      if ((err as AxiosError)?.response?.status === 409) {
        setNameError(validation.firstName ?? 'Uživatel s tímto jménem již existuje');
        toast.error(validation.firstName ?? 'Uživatel s tímto jménem již existuje');
      } else {
        console.error('Failed to add user:', err);
        toast.error((toastError?.create ?? 'Nepodařilo se vytvořit {{item}}').replace('{{item}}', 'uživatele'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{(addDialog.title as string) ?? 'Přidat uživatele'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={(addDialog.name as string) ?? 'Jméno'}
            type="text"
            fullWidth
            value={name}
            onChange={handleNameChange}
            error={Boolean(nameError)}
            helperText={nameError}
            disabled={isSubmitting}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>{(addDialog.gender as string) ?? 'Pohlaví'}</InputLabel>
            <Select
              value={gender}
              onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE')}
              disabled={isSubmitting}
            >
              <MenuItem value="MALE">{(addDialog.genders as Record<string, string>)?.male ?? 'Muž'}</MenuItem>
              <MenuItem value="FEMALE">{(addDialog.genders as Record<string, string>)?.female ?? 'Žena'}</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            {(addDialog.cancel as string) ?? 'Zrušit'}
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {(addDialog.submit as string) ?? 'Přidat'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}; 