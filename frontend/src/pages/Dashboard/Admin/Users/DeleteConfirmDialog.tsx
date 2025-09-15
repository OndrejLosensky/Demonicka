import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import translations from '../../../../locales/cs/dashboard.users.json';

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
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{translations.dialogs.delete.title}</DialogTitle>
      <DialogContent>
        <Typography>
          {translations.dialogs.delete.message}
          <br />
          <strong>{userName}</strong>
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