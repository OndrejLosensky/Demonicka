import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Typography, Button } from '@demonicka/ui';
import type { ActivityLogEntry } from './activity.types';

export function ActivityLogDetailDialog({
  open,
  log,
  onClose,
  onCopy,
}: {
  open: boolean;
  log: ActivityLogEntry | null;
  onClose: () => void;
  onCopy: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Detail záznamu</DialogTitle>
      <DialogContent dividers>
        {log ? (
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 2,
              borderRadius: 1,
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'auto',
              fontSize: '0.8rem',
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              lineHeight: 1.4,
            }}
          >
            {JSON.stringify(log, null, 2)}
          </Box>
        ) : (
          <Typography color="text.secondary">Žádný záznam</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCopy} disabled={!log} variant="outlined">
          Kopírovat JSON
        </Button>
        <Button onClick={onClose} variant="contained">
          Zavřít
        </Button>
      </DialogActions>
    </Dialog>
  );
}

