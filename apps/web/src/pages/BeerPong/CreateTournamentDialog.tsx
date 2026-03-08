import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from '@demonicka/ui';
import { toast } from 'react-hot-toast';
import { beerPongService } from '../../services/beerPongService';
import { useActiveEvent } from '../../contexts/ActiveEventContext';
import type { CreateBeerPongEventDto } from '@demonicka/shared-types';
import { CancellationPolicy } from '@demonicka/shared-types';
import { useTranslations } from '../../contexts/LocaleContext';

interface CreateTournamentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateTournamentDialog: React.FC<CreateTournamentDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { activeEvent } = useActiveEvent();
  const t = useTranslations<Record<string, unknown>>('beerPong');
  const createDialog = (t.createDialog as Record<string, unknown>) || {};
  const fields = (createDialog.fields as Record<string, string>) || {};
  const buttons = (createDialog.buttons as Record<string, string>) || {};
  const errors = (createDialog.errors as Record<string, string>) || {};
  const cancellationPolicy = (createDialog.cancellationPolicy as Record<string, string>) || {};
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateBeerPongEventDto>({
    eventId: '',
    name: '',
    description: '',
    beersPerPlayer: 2,
    timeWindowMinutes: 5,
    undoWindowMinutes: 5,
    cancellationPolicy: CancellationPolicy.KEEP_BEERS,
    beerSize: 'LARGE',
    beerVolumeLitres: 0.5,
  });

  useEffect(() => {
    if (open && activeEvent) {
      setFormData({
        eventId: activeEvent.id,
        name: '',
        description: '',
        beersPerPlayer: 2,
        timeWindowMinutes: 5,
        undoWindowMinutes: 5,
        cancellationPolicy: CancellationPolicy.KEEP_BEERS,
        beerSize: 'LARGE',
        beerVolumeLitres: 0.5,
      });
    }
  }, [open, activeEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeEvent) {
      toast.error(errors.noActiveEvent ?? 'Není vybrána žádná aktivní událost');
      return;
    }

    if (!formData.name.trim()) {
      toast.error(errors.nameRequired ?? 'Název turnaje je povinný');
      return;
    }

    try {
      setIsSubmitting(true);
      await beerPongService.create({
        ...formData,
        eventId: activeEvent.id,
      });
      toast.success((createDialog.success as string) ?? 'Turnaj byl úspěšně vytvořen');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to create tournament:', error);
      toast.error(error.response?.data?.message || (errors.createFailed ?? 'Nepodařilo se vytvořit turnaj'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{(createDialog.title as string) ?? 'Vytvořit Beer Pong Turnaj'}</DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label={fields.tournamentName ?? 'Název turnaje'}
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              disabled={isSubmitting}
            />

            <TextField
              label={fields.description ?? 'Popis (volitelné)'}
              fullWidth
              multiline
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              disabled={isSubmitting}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label={fields.beersPerPlayer ?? 'Piv na hráče'}
                type="number"
                fullWidth
                value={formData.beersPerPlayer || 2}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    beersPerPlayer: parseInt(e.target.value) || 2,
                  }))
                }
                inputProps={{ min: 1, max: 10 }}
                disabled={isSubmitting}
              />

              <TextField
                label={fields.timeWindowMinutes ?? 'Časové okno (minuty)'}
                type="number"
                fullWidth
                value={formData.timeWindowMinutes || 5}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    timeWindowMinutes: parseInt(e.target.value) || 5,
                  }))
                }
                inputProps={{ min: 1, max: 60 }}
                disabled={isSubmitting}
                helperText={fields.timeWindowHelper}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label={fields.undoWindowMinutes ?? 'Okno pro zrušení (minuty)'}
                type="number"
                fullWidth
                value={formData.undoWindowMinutes || 5}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    undoWindowMinutes: parseInt(e.target.value) || 5,
                  }))
                }
                inputProps={{ min: 1, max: 60 }}
                disabled={isSubmitting}
                helperText={fields.undoWindowHelper}
              />

              <FormControl fullWidth disabled={isSubmitting}>
                <InputLabel>{fields.cancellationPolicy ?? 'Politika zrušení'}</InputLabel>
                <Select
                  value={formData.cancellationPolicy || CancellationPolicy.KEEP_BEERS}
                  label={fields.cancellationPolicy ?? 'Politika zrušení'}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cancellationPolicy: e.target.value as CancellationPolicy,
                    }))
                  }
                >
                  <MenuItem value={CancellationPolicy.KEEP_BEERS}>{cancellationPolicy.keepBeers ?? 'Ponechat piva'}</MenuItem>
                  <MenuItem value={CancellationPolicy.REMOVE_BEERS}>{cancellationPolicy.removeBeers ?? 'Odebrat piva'}</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth disabled={isSubmitting}>
                <InputLabel>Velikost piva</InputLabel>
                <Select
                  value={formData.beerSize || 'LARGE'}
                  label="Velikost piva"
                  onChange={(e) => {
                    const beerSize = e.target.value as 'SMALL' | 'LARGE';
                    setFormData((prev) => ({
                      ...prev,
                      beerSize,
                      beerVolumeLitres: beerSize === 'SMALL' ? 0.3 : 0.5,
                    }));
                  }}
                >
                  <MenuItem value="LARGE">Velké (0.5 L)</MenuItem>
                  <MenuItem value="SMALL">Malé (0.3 L)</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Objem piva (L)"
                type="number"
                fullWidth
                value={formData.beerVolumeLitres || 0.5}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    beerVolumeLitres: parseFloat(e.target.value) || 0.5,
                  }))
                }
                inputProps={{ min: 0.1, max: 1.0, step: 0.1 }}
                disabled={isSubmitting}
                helperText="Objem jednoho piva v litrech"
              />
            </Box>

            {activeEvent && (
              <Typography variant="body2" color="text.secondary">
                {fields.creatingForEvent ?? 'Vytváření turnaje pro událost:'} <strong>{activeEvent.name}</strong>
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            {buttons.cancel ?? 'Zrušit'}
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {buttons.create ?? 'Vytvořit Turnaj'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
