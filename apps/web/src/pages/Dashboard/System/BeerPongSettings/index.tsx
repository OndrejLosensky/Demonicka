import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Divider,
} from '@demonicka/ui';
import { Alert } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { CancellationPolicy } from '@demonicka/shared-types';
import translations from '../../../../locales/cs/beerPongSettings.json';
import { api } from '../../../../services/api';

/**
 * Beer Pong Settings Page
 */
const BeerPongSettingsPage: React.FC = () => {
  const [defaultBeersPerPlayer, setDefaultBeersPerPlayer] = useState(2);
  const [defaultTimeWindowMinutes, setDefaultTimeWindowMinutes] = useState(5);
  const [defaultUndoWindowMinutes, setDefaultUndoWindowMinutes] = useState(5);
  const [defaultCancellationPolicy, setDefaultCancellationPolicy] = useState<CancellationPolicy>(
    CancellationPolicy.KEEP_BEERS,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/system/beer-pong-defaults');
        const data = response.data as {
          beersPerPlayer: number;
          timeWindowMinutes: number;
          undoWindowMinutes: number;
          cancellationPolicy: CancellationPolicy;
        };

        setDefaultBeersPerPlayer(data.beersPerPlayer);
        setDefaultTimeWindowMinutes(data.timeWindowMinutes);
        setDefaultUndoWindowMinutes(data.undoWindowMinutes);
        setDefaultCancellationPolicy(data.cancellationPolicy);
      } catch (e) {
        console.error('Failed to load beer pong defaults:', e);
        toast.error('Nepodařilo se načíst Beer Pong nastavení');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await api.put('/system/beer-pong-defaults', {
        beersPerPlayer: defaultBeersPerPlayer,
        timeWindowMinutes: defaultTimeWindowMinutes,
        undoWindowMinutes: defaultUndoWindowMinutes,
        cancellationPolicy: defaultCancellationPolicy,
      });
      toast.success(translations.toasts.saveSuccess);
    } catch (e) {
      console.error('Failed to save beer pong defaults:', e);
      toast.error('Nepodařilo se uložit nastavení');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            {translations.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {translations.subtitle}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          sx={{ minWidth: 120 }}
          disabled={isLoading || isSaving}
        >
          {translations.save}
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>{translations.infoNote.title}</strong> {translations.infoNote.text}
        </Typography>
      </Alert>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Beers Per Player */}
          <Grid item xs={12} md={6}>
            <TextField
              label={translations.fields.beersPerPlayer.label}
              type="number"
              fullWidth
              value={defaultBeersPerPlayer}
              onChange={(e) => setDefaultBeersPerPlayer(Math.max(1, Number(e.target.value)))}
              inputProps={{ min: 1 }}
              helperText={translations.fields.beersPerPlayer.helper}
              disabled={isLoading}
            />
          </Grid>

          {/* Time Window Minutes */}
          <Grid item xs={12} md={6}>
            <TextField
              label={translations.fields.timeWindowMinutes.label}
              type="number"
              fullWidth
              value={defaultTimeWindowMinutes}
              onChange={(e) => setDefaultTimeWindowMinutes(Math.max(0, Number(e.target.value)))}
              inputProps={{ min: 0 }}
              helperText={translations.fields.timeWindowMinutes.helper}
              disabled={isLoading}
            />
          </Grid>

          {/* Undo Window Minutes */}
          <Grid item xs={12} md={6}>
            <TextField
              label={translations.fields.undoWindowMinutes.label}
              type="number"
              fullWidth
              value={defaultUndoWindowMinutes}
              onChange={(e) => setDefaultUndoWindowMinutes(Math.max(0, Number(e.target.value)))}
              inputProps={{ min: 0 }}
              helperText={translations.fields.undoWindowMinutes.helper}
              disabled={isLoading}
            />
          </Grid>

          {/* Cancellation Policy */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>{translations.fields.cancellationPolicy.label}</InputLabel>
              <Select
                value={defaultCancellationPolicy}
                label={translations.fields.cancellationPolicy.label}
                onChange={(e) => setDefaultCancellationPolicy(e.target.value as CancellationPolicy)}
                disabled={isLoading}
              >
                <MenuItem value={CancellationPolicy.KEEP_BEERS}>{translations.fields.cancellationPolicy.keepBeers}</MenuItem>
                <MenuItem value={CancellationPolicy.REMOVE_BEERS}>{translations.fields.cancellationPolicy.removeBeers}</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {translations.fields.cancellationPolicy.helper}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Documentation Section */}
        <Box>
          <Typography variant="h6" gutterBottom>
            {translations.descriptions.title}
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              {translations.descriptions.beersPerPlayer.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {translations.descriptions.beersPerPlayer.text}
            </Typography>

            <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
              {translations.descriptions.timeWindowMinutes.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {translations.descriptions.timeWindowMinutes.text}
            </Typography>

            <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
              {translations.descriptions.undoWindowMinutes.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {translations.descriptions.undoWindowMinutes.text}
            </Typography>

            <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
              {translations.descriptions.cancellationPolicy.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {translations.descriptions.cancellationPolicy.text}
            </Typography>
            <Box component="ul" sx={{ ml: 3, mb: 2 }}>
              <li>
                <strong>{translations.fields.cancellationPolicy.keepBeers}:</strong> {translations.descriptions.cancellationPolicy.keepBeers}
              </li>
              <li>
                <strong>{translations.fields.cancellationPolicy.removeBeers}:</strong> {translations.descriptions.cancellationPolicy.removeBeers}
              </li>
            </Box>
          </Box>

          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>{translations.warnings.important.title}</strong> {translations.warnings.important.text}
            </Typography>
          </Alert>
        </Box>
      </Paper>
    </Box>
  );
};

export default BeerPongSettingsPage;
