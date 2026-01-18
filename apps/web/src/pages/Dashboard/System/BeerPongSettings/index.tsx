import React, { useState } from 'react';
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

/**
 * Beer Pong Settings Page
 * 
 * Note: Currently, these are default values displayed for reference.
 * Settings are configured per tournament when creating a new beer pong event.
 * In the future, these could be stored as global defaults in the backend.
 */
const BeerPongSettingsPage: React.FC = () => {
  // Default values (matching backend defaults)
  const [defaultBeersPerPlayer, setDefaultBeersPerPlayer] = useState(2);
  const [defaultTimeWindowMinutes, setDefaultTimeWindowMinutes] = useState(5);
  const [defaultUndoWindowMinutes, setDefaultUndoWindowMinutes] = useState(5);
  const [defaultCancellationPolicy, setDefaultCancellationPolicy] = useState<CancellationPolicy>(
    CancellationPolicy.KEEP_BEERS,
  );

  const handleSave = () => {
    // TODO: Implement backend API for saving default settings
    // For now, this is just a placeholder showing the structure
    toast.success(translations.toasts.saveSuccess);
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
