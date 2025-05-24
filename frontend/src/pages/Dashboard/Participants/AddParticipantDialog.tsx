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
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');

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
    if (!value.trim()) {
      setNameError(translations.dialogs.add.validation.required);
      return false;
    }
    if (existingNames.includes(value.trim().toLowerCase())) {
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
      await participantsApi.create({ name: name.trim(), gender });
      toast.success(translations.dialogs.add.success);
      onSuccess();
      onClose();
    } catch (error) {
      if ((error as AxiosError)?.response?.status === 409) {
        setNameError(translations.dialogs.add.validation.firstName);
        toast.error(translations.dialogs.add.validation.firstName);
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
              label={translations.dialogs.add.fields.firstName}
              value={name}
              onChange={handleNameChange}
              error={!!nameError}
              helperText={nameError}
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
            disabled={isSubmitting || !!nameError}
          >
            {translations.dialogs.add.buttons.confirm}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}; 