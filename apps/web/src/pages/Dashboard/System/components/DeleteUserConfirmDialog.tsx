import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

type DeleteUserConfirmDialogProps = {
  open: boolean;
  username?: string | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  labels: {
    title: string;
    message: string; // should include {{username}}
    cancel: string;
    confirm: string;
  };
};

export const DeleteUserConfirmDialog: React.FC<DeleteUserConfirmDialogProps> = ({
  open,
  username,
  onClose,
  onConfirm,
  isLoading,
  labels,
}) => {
  const renderedMessage = labels.message.replace(
    '{{username}}',
    username ?? '-',
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{labels.title}</DialogTitle>
      <DialogContent>
        <Typography>{renderedMessage}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          {labels.cancel}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          color="error"
          variant="contained"
        >
          {labels.confirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

