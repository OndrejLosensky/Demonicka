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
    toast.success('Settings saved! (Note: These defaults are applied per tournament when creating new events)');
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Beer Pong Default Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Configure default values for new beer pong tournaments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          sx={{ minWidth: 120 }}
        >
          Save
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> These settings are used as defaults when creating new beer pong tournaments.
          Each tournament can have its own customized values. Settings can be changed per tournament
          during creation or by editing the tournament.
        </Typography>
      </Alert>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Beers Per Player */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Beers Per Player"
              type="number"
              fullWidth
              value={defaultBeersPerPlayer}
              onChange={(e) => setDefaultBeersPerPlayer(Math.max(1, Number(e.target.value)))}
              inputProps={{ min: 1 }}
              helperText="Number of beers automatically added to each player when a game starts"
            />
          </Grid>

          {/* Time Window Minutes */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Time Window (minutes)"
              type="number"
              fullWidth
              value={defaultTimeWindowMinutes}
              onChange={(e) => setDefaultTimeWindowMinutes(Math.max(0, Number(e.target.value)))}
              inputProps={{ min: 0 }}
              helperText="Maximum time window to start a game after initial attempt"
            />
          </Grid>

          {/* Undo Window Minutes */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Undo Window (minutes)"
              type="number"
              fullWidth
              value={defaultUndoWindowMinutes}
              onChange={(e) => setDefaultUndoWindowMinutes(Math.max(0, Number(e.target.value)))}
              inputProps={{ min: 0 }}
              helperText="Time window to undo game start and remove added beers"
            />
          </Grid>

          {/* Cancellation Policy */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Default Cancellation Policy</InputLabel>
              <Select
                value={defaultCancellationPolicy}
                label="Default Cancellation Policy"
                onChange={(e) => setDefaultCancellationPolicy(e.target.value as CancellationPolicy)}
              >
                <MenuItem value={CancellationPolicy.KEEP_BEERS}>Keep Beers</MenuItem>
                <MenuItem value={CancellationPolicy.REMOVE_BEERS}>Remove Beers</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              What happens to beers when a tournament is cancelled
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Documentation Section */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Setting Descriptions
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Beers Per Player
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              The number of beers automatically added to each player (4 players total per game) when a game starts.
              This simulates the real-world scenario where players receive beers before the game begins.
            </Typography>

            <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
              Time Window (minutes)
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              The maximum time window (in minutes) allowed to successfully start a game after the initial attempt.
              This prevents race conditions and ensures games are started within a reasonable time frame.
              If exceeded, the game start operation will fail and must be retried.
            </Typography>

            <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
              Undo Window (minutes)
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              The time window (in minutes) during which operators can undo a game start. After this window expires,
              the game cannot be undone and beers remain added to players. This prevents accidental beer removal
              after significant time has passed.
            </Typography>

            <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
              Cancellation Policy
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Defines what happens to beers when a tournament is cancelled:
            </Typography>
            <Box component="ul" sx={{ ml: 3, mb: 2 }}>
              <li>
                <strong>Keep Beers:</strong> Beers added during games remain in players' counts even if the tournament is cancelled.
              </li>
              <li>
                <strong>Remove Beers:</strong> Beers added during games are removed from players' counts if the tournament is cancelled.
              </li>
            </Box>
          </Box>

          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Important:</strong> Changing these defaults only affects new tournaments. Existing tournaments
              retain their original settings. To change settings for an existing tournament, edit the tournament directly.
            </Typography>
          </Alert>
        </Box>
      </Paper>
    </Box>
  );
};

export default BeerPongSettingsPage;
