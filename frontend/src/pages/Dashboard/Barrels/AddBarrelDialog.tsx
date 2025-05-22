import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import { toast } from 'react-hot-toast';
import { barrelsApi } from './api';

interface AddBarrelDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddBarrelDialog: React.FC<AddBarrelDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [size, setSize] = useState<15 | 30 | 50>(15);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSize(15);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      await barrelsApi.create({ size });
      toast.success('Barrel added successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to add barrel:', error);
      toast.error('Failed to add barrel');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add New Barrel</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Size (L)</InputLabel>
              <Select
                value={size}
                label="Size (L)"
                onChange={(e) => setSize(e.target.value as 15 | 30 | 50)}
              >
                <MenuItem value={15}>15L</MenuItem>
                <MenuItem value={30}>30L</MenuItem>
                <MenuItem value={50}>50L</MenuItem>
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
            disabled={isSubmitting}
          >
            Add
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}; 