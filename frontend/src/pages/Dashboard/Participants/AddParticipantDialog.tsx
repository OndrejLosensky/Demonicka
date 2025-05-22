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
      setNameError('Name is required');
      return false;
    }
    if (existingNames.includes(value.trim().toLowerCase())) {
      setNameError('This name already exists');
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
      toast.success('Participant added successfully');
      onSuccess();
      onClose();
    } catch (error) {
      if ((error as AxiosError)?.response?.status === 409) {
        setNameError('This name already exists');
        toast.error('This name is already taken');
      } else {
        console.error('Failed to add participant:', error);
        toast.error('Failed to add participant');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add New Participant</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              autoFocus
              label="Name"
              value={name}
              onChange={handleNameChange}
              error={!!nameError}
              helperText={nameError}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                value={gender}
                label="Gender"
                onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE')}
              >
                <MenuItem value="MALE">Male</MenuItem>
                <MenuItem value="FEMALE">Female</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting || !!nameError}
          >
            Add
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}; 