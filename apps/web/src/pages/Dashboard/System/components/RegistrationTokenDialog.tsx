import React, { useMemo } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material';
import { ContentCopy as CopyIcon } from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';

type RegistrationTokenDialogProps = {
  open: boolean;
  username?: string | null;
  token: string | null;
  onClose: () => void;
  onCopy: (value: string) => Promise<void>;
  labels: {
    title: string;
    tokenLabel: string;
    urlLabel: string;
    qrTitle: string;
    close: string;
    copyToken: string;
    copyUrl: string;
  };
};

export const RegistrationTokenDialog: React.FC<RegistrationTokenDialogProps> = ({
  open,
  username,
  token,
  onClose,
  onCopy,
  labels,
}) => {
  const registrationUrl = useMemo(() => {
    if (!token) return '';
    return `${window.location.origin}/complete-registration?token=${encodeURIComponent(token)}`;
  }, [token]);

  const title = username ? `${labels.title}: ${username}` : labels.title;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label={labels.tokenLabel}
            value={token ?? ''}
            fullWidth
            InputProps={{
              readOnly: true,
              endAdornment: (
                <Tooltip title={labels.copyToken}>
                  <IconButton
                    edge="end"
                    onClick={() => token && onCopy(token)}
                    disabled={!token}
                    size="small"
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ),
            }}
          />

          <TextField
            label={labels.urlLabel}
            value={registrationUrl}
            fullWidth
            InputProps={{
              readOnly: true,
              endAdornment: (
                <Tooltip title={labels.copyUrl}>
                  <IconButton
                    edge="end"
                    onClick={() => registrationUrl && onCopy(registrationUrl)}
                    disabled={!registrationUrl}
                    size="small"
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ),
            }}
          />

          <Box display="flex" flexDirection="column" alignItems="center" gap={1} pt={1}>
            <Typography variant="subtitle1" fontWeight="medium">
              {labels.qrTitle}
            </Typography>
            <Box
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 2,
                p: 2,
                border: 1,
                borderColor: 'divider',
              }}
            >
              <QRCodeSVG value={registrationUrl || ' '} size={180} />
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{labels.close}</Button>
      </DialogActions>
    </Dialog>
  );
};

