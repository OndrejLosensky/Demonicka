import { useState } from 'react';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';

interface AddBarrelDialogProps {
  open: boolean;
  onClose: () => void;
}

interface CreateBarrelDto {
  size: number;
}

export function AddBarrelDialog({ open, onClose }: AddBarrelDialogProps) {
  const [size, setSize] = useState<number>(15);
  const queryClient = useQueryClient();

  const createBarrelMutation = useMutation({
    mutationFn: (data: CreateBarrelDto) => api.post('/barrels', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barrels'] });
      toast.success('Barrel added successfully');
      onClose();
    },
    onError: () => {
      toast.error('Failed to add barrel');
    },
  });

  const handleSubmit = () => {
    createBarrelMutation.mutate({ size });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Barrel</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="size-label">Barrel Size</InputLabel>
          <Select
            labelId="size-label"
            value={size}
            label="Barrel Size"
            onChange={(e) => setSize(Number(e.target.value))}
          >
            <MenuItem value={15}>15L</MenuItem>
            <MenuItem value={30}>30L</MenuItem>
            <MenuItem value={50}>50L</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Add Barrel
        </Button>
      </DialogActions>
    </Dialog>
  );
} 