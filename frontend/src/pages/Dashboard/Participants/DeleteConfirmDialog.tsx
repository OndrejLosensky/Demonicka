import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { FaUserTimes } from 'react-icons/fa';
import translations from '../../../locales/cs/dashboard.participants.json';

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
        <span>{translations.dialogs.delete.title}</span>
      </DialogTitle>
      <DialogContent>
        <Typography>
          {translations.dialogs.delete.message.replace('{name}', participantName)}
        </Typography>
      </DialogContent>
      <DialogActions className="p-6">
        <Button onClick={onClose} variant="outlined" color="inherit">
          {translations.dialogs.delete.cancel}
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error" autoFocus>
          {translations.dialogs.delete.confirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 