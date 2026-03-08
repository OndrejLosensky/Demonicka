import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { FaTrashAlt } from 'react-icons/fa';
import { useTranslations } from '../../../contexts/LocaleContext';

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
  const t = useTranslations<Record<string, unknown>>('dashboard.barrels');
  const deleteDialog = ((t.dialogs as Record<string, Record<string, string>>)?.delete) || {};
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="flex items-center gap-3">
        <div className="p-2 bg-red-500/10 rounded-lg">
          <FaTrashAlt className="text-xl text-red-500" />
        </div>
        <span>{deleteDialog.title}</span>
      </DialogTitle>
      <DialogContent>
        <Typography>
          {(deleteDialog.message || '').replace('{size}', barrelSize.toString())}
        </Typography>
        <Typography className="mt-2 text-sm text-text-secondary">
          {deleteDialog.additionalInfo}
        </Typography>
      </DialogContent>
      <DialogActions className="p-6">
        <Button onClick={onClose} variant="outlined" color="inherit">
          {deleteDialog.cancel}
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error" autoFocus>
          {deleteDialog.confirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 