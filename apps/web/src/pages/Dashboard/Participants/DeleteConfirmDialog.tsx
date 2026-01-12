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
  participantUsername: string;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  participantUsername,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FaUserTimes className="text-red-500" />
        {translations.dialogs.delete.title}
      </DialogTitle>
      <DialogContent>
        <Typography>
          {translations.dialogs.delete.message.replace('{username}', participantUsername)}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{translations.dialogs.delete.cancel}</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          {translations.dialogs.delete.confirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 