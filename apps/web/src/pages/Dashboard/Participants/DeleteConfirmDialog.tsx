import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { FaUserTimes } from 'react-icons/fa';
import { useTranslations } from '../../../contexts/LocaleContext';

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
  const t = useTranslations<Record<string, unknown>>('dashboard.participants');
  const deleteDialog = ((t.dialogs as Record<string, Record<string, string>>)?.delete) || {};
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FaUserTimes className="text-red-500" />
        {deleteDialog.title}
      </DialogTitle>
      <DialogContent>
        <Typography>
          {(deleteDialog.message || '').replace('{username}', participantUsername)}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{deleteDialog.cancel}</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          {deleteDialog.confirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 