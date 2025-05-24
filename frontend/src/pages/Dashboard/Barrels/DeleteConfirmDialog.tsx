import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { FaTrashAlt } from 'react-icons/fa';
import translations from '../../../locales/cs/dashboard.barrels.json';

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
        <span>{translations.dialogs.delete.title}</span>
      </DialogTitle>
      <DialogContent>
        <Typography>
          {translations.dialogs.delete.message.replace('{size}', barrelSize.toString())}
        </Typography>
        <Typography className="mt-2 text-sm text-text-secondary">
          {translations.dialogs.delete.additionalInfo}
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