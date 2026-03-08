import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { useTranslations } from '../../../contexts/LocaleContext';

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  userName,
}) => {
  const t = useTranslations<Record<string, unknown>>('dashboard.users');
  const deleteDialog = ((t.dialogs as Record<string, Record<string, string>>)?.delete) || {};
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{deleteDialog.title}</DialogTitle>
      <DialogContent>
        <Typography>
          {deleteDialog.message}
          <br />
          <strong>{userName}</strong>
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