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
  FormControlLabel,
  Switch,
} from '@mui/material';
import { toast } from 'react-hot-toast';
import { barrelService } from '../../../services/barrelService';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { eventService } from '../../../services/eventService';
import translations from '../../../locales/cs/dashboard.barrels.json';

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
  const [makeActive, setMakeActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { activeEvent } = useActiveEvent();

  // Reset form state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSize(15);
      setMakeActive(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      // Get all barrels including deleted ones to get correct order number
      const [activeBarrels, deletedBarrels] = await Promise.all([
        barrelService.getAll(),
        barrelService.getDeleted()
      ]);
      const orderNumber = activeBarrels.length + deletedBarrels.length + 1;
      const barrel = await barrelService.create({ size, orderNumber });

      // If there's an active event, automatically add the barrel to it
      if (activeEvent) {
        await eventService.addBarrel(activeEvent.id, barrel.id);
      }

      // If makeActive is true, activate the barrel
      if (makeActive) {
        await barrelService.activate(barrel.id);
      }

      toast.success(translations.dialogs.add.success);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to add barrel:', error);
      toast.error(translations.dialogs.add.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{translations.dialogs.add.title}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="size-label">{translations.dialogs.add.size}</InputLabel>
          <Select
            labelId="size-label"
            value={size}
            label={translations.dialogs.add.size}
            onChange={(e) => setSize(Number(e.target.value) as 15 | 30 | 50)}
          >
            <MenuItem value={15}>15L</MenuItem>
            <MenuItem value={30}>30L</MenuItem>
            <MenuItem value={50}>50L</MenuItem>
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Switch
              checked={makeActive}
              onChange={(e) => setMakeActive(e.target.checked)}
            />
          }
          label={translations.dialogs.add.makeActive}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          {translations.dialogs.add.cancel}
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={isSubmitting}
        >
          {translations.dialogs.add.confirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 