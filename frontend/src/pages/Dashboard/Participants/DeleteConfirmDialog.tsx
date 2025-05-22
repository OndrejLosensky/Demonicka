import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { FaUserTimes } from 'react-icons/fa';

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  participantName: string;
}

export const DeleteConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  participantName,
}: DeleteConfirmDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="flex items-center gap-3">
        <div className="p-2 bg-red-500/10 rounded-lg">
          <FaUserTimes className="text-xl text-red-500" />
        </div>
        <span>Delete Participant</span>
      </DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete <strong>{participantName}</strong>? This action cannot be undone.
        </Typography>
        <Typography className="mt-2 text-sm text-text-secondary">
          All their beer records will be permanently removed from the system.
        </Typography>
      </DialogContent>
      <DialogActions className="p-6">
        <Button onClick={onClose} variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error" autoFocus>
          Delete Participant
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 