import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { FaTrashAlt } from 'react-icons/fa';

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  barrelSize: number;
}

export const DeleteConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  barrelSize,
}: DeleteConfirmDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="flex items-center gap-3">
        <div className="p-2 bg-red-500/10 rounded-lg">
          <FaTrashAlt className="text-xl text-red-500" />
        </div>
        <span>Delete Barrel</span>
      </DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete this <strong>{barrelSize}L</strong> barrel? This action cannot be undone.
        </Typography>
        <Typography className="mt-2 text-sm text-text-secondary">
          All associated data will be permanently removed from the system.
        </Typography>
      </DialogContent>
      <DialogActions className="p-6">
        <Button onClick={onClose} variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error" autoFocus>
          Delete Barrel
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 