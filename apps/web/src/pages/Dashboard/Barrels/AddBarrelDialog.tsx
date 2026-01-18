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
  const [size, setSize] = useState<15 | 30 | 50>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { activeEvent } = useActiveEvent();

  // Reset form state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSize(30);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      // Get event-specific barrels to find the next available order number for this event
      // This ensures sequential numbering within the event (e.g., #1, #2, #3) rather than globally
      const eventBarrels = activeEvent 
        ? await barrelService.getByEvent(activeEvent.id)
        : await barrelService.getAll(true); // fallback to all if no active event
      
      // Find the next available order number by looking for gaps in event barrels
      let orderNumber = 1;
      const usedNumbers = new Set(eventBarrels.map(barrel => barrel.orderNumber));
      
      while (usedNumbers.has(orderNumber)) {
        orderNumber++;
      }
      const barrel = await barrelService.create({ size, orderNumber });

      // If there's an active event, automatically add the barrel to it
      if (activeEvent) {
        await eventService.addBarrel(activeEvent.id, barrel.id);
      }

      // Always activate new barrels
      await barrelService.activate(barrel.id);

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
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{translations.dialogs.add.title}</DialogTitle>
      <DialogContent sx={{ pb: 4 }}>
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