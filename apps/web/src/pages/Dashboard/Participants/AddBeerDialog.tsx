import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
} from '@mui/material';

interface AddBeerDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (beerSize: 'SMALL' | 'LARGE', volumeLitres: number) => void;
  participantName?: string;
}

export const AddBeerDialog: React.FC<AddBeerDialogProps> = ({
  open,
  onClose,
  onConfirm,
  participantName,
}) => {
  const [beerSize, setBeerSize] = useState<'SMALL' | 'LARGE'>('LARGE');

  const handleConfirm = () => {
    const volumeLitres = beerSize === 'SMALL' ? 0.3 : 0.5;
    onConfirm(beerSize, volumeLitres);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Přidat pivo{participantName ? ` pro ${participantName}` : ''}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Vyberte velikost piva:
          </Typography>
          <RadioGroup
            value={beerSize}
            onChange={(e) => setBeerSize(e.target.value as 'SMALL' | 'LARGE')}
          >
            <FormControlLabel
              value="LARGE"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body1">Velké (0.5 L)</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Standardní velikost
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              value="SMALL"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body1">Malé (0.3 L)</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Menší velikost
                  </Typography>
                </Box>
              }
            />
          </RadioGroup>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Zrušit</Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          Přidat
        </Button>
      </DialogActions>
    </Dialog>
  );
};
