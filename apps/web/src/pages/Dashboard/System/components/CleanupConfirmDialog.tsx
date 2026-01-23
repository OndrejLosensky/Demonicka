import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { LoadingButton } from '@demonicka/ui';
import { tokens } from '../../../../theme/tokens';

export interface CleanupConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'warning' | 'error';
  isLoading?: boolean;
}

export const CleanupConfirmDialog: React.FC<CleanupConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Smazat',
  cancelText = 'Zrušit',
  severity = 'warning',
  isLoading = false,
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Cleanup operation failed:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: tokens.borderRadius.md,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color={severity} />
          <Typography variant="h6" component="span">
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity={severity} sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
            Tato akce je nevratná!
          </Typography>
        </Alert>
        
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          disabled={isLoading}
          variant="outlined"
          size="large"
        >
          {cancelText}
        </Button>
        <LoadingButton
          onClick={handleConfirm}
          variant="contained"
          color={severity === 'error' ? 'error' : 'warning'}
          size="large"
          loading={isLoading}
          loadingText="Probíhá..."
        >
          {confirmText}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}; 