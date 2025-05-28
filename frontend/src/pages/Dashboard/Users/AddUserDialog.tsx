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
  FormHelperText,
} from '@mui/material';
import { toast } from 'react-hot-toast';
import type { AxiosError } from 'axios';
import type { AddUserDialogProps } from './types';
import { userService } from '../../../services/userService';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { useSelectedEvent } from '../../../contexts/SelectedEventContext';
import { eventService } from '../../../services/eventService';
import translations from '../../../locales/cs/dashboard.users.json';

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
      setNameError(translations.dialogs.add.validation.required);
      return false;
    }
    
    // Case-insensitive name comparison
    const nameExists = existingNames.some(
      existingName => existingName.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (nameExists) {
      setNameError(translations.dialogs.add.validation.firstName);
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
      
      toast.success(translations.dialogs.add.success);
      onSuccess(); // This will refresh the users list
      onClose();
    } catch (error) {
      if ((error as AxiosError)?.response?.status === 409) {
        setNameError(translations.dialogs.add.validation.firstName);
        toast.error(translations.dialogs.add.validation.firstName);
      } else {
        console.error('Failed to add user:', error);
        toast.error(translations.dialogs.add.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{translations.dialogs.add.title}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={translations.dialogs.add.name}
            type="text"
            fullWidth
            value={name}
            onChange={handleNameChange}
            error={Boolean(nameError)}
            helperText={nameError}
            disabled={isSubmitting}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>{translations.dialogs.add.gender}</InputLabel>
            <Select
              value={gender}
              onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE')}
              disabled={isSubmitting}
            >
              <MenuItem value="MALE">{translations.dialogs.add.genders.male}</MenuItem>
              <MenuItem value="FEMALE">{translations.dialogs.add.genders.female}</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            {translations.dialogs.add.cancel}
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {translations.dialogs.add.submit}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}; 