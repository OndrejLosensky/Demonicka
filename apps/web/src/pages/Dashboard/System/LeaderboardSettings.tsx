import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper,
  Grid,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import {
  leaderboardViewSettingsService,
  type LeaderboardViewSettings,
  type UpdateLeaderboardViewSettingsDto,
} from '../../../services/leaderboardViewSettingsService';
import { beerPongService } from '../../../services/beerPongService';
import type { BeerPongEvent } from '@demonicka/shared-types';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';

const LeaderboardSettingsPage: React.FC = () => {
  const { activeEvent } = useActiveEvent();
  const [settings, setSettings] = useState<LeaderboardViewSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [beerPongTournaments, setBeerPongTournaments] = useState<BeerPongEvent[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await leaderboardViewSettingsService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load leaderboard view settings:', error);
      toast.error('Nepodařilo se načíst nastavení žebříčku');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTournaments = useCallback(async () => {
    if (!activeEvent?.id) {
      setBeerPongTournaments([]);
      return;
    }

    try {
      setLoadingTournaments(true);
      const tournaments = await beerPongService.getActiveTournaments(activeEvent.id);
      setBeerPongTournaments(tournaments);
    } catch (error) {
      console.error('Failed to load beer pong tournaments:', error);
      toast.error('Nepodařilo se načíst turnaje beer pongu');
    } finally {
      setLoadingTournaments(false);
    }
  }, [activeEvent?.id]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  const handleSave = async () => {
    if (!settings) return;

    try {
      setIsSaving(true);
      const updateData: UpdateLeaderboardViewSettingsDto = {
        autoSwitchEnabled: settings.autoSwitchEnabled,
        currentView: settings.currentView,
        switchIntervalSeconds: settings.switchIntervalSeconds,
        selectedBeerPongEventId: settings.selectedBeerPongEventId,
      };

      await leaderboardViewSettingsService.updateSettings(updateData);
      toast.success('Nastavení žebříčku bylo úspěšně uloženo');
      await loadSettings();
    } catch (error) {
      console.error('Failed to update leaderboard view settings:', error);
      toast.error('Nepodařilo se uložit nastavení žebříčku');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!settings) {
    return (
      <Box>
        <Typography color="error">Nepodařilo se načíst nastavení</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Nastavení žebříčku
        </Typography>
        <Button
          variant="contained"
          startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={isSaving}
        >
          Uložit
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoSwitchEnabled}
                  onChange={(e) =>
                    setSettings({ ...settings, autoSwitchEnabled: e.target.checked })
                  }
                  color="primary"
                />
              }
              label="Povolit automatické přepínání"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Automaticky přepíná mezi žebříčkem uživatelů a výsledky beer pongu
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="current-view-label">Aktuální zobrazení</InputLabel>
              <Select
                labelId="current-view-label"
                label="Aktuální zobrazení"
                value={settings.currentView}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    currentView: e.target.value as 'LEADERBOARD' | 'BEER_PONG' | 'AUTO',
                  })
                }
              >
                <MenuItem value="LEADERBOARD">Žebříček uživatelů</MenuItem>
                <MenuItem value="BEER_PONG">Beer Pong</MenuItem>
                <MenuItem value="AUTO">Automaticky</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Interval přepínání (sekundy)"
              type="number"
              value={settings.switchIntervalSeconds}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  switchIntervalSeconds: Math.max(5, parseInt(e.target.value) || 15),
                })
              }
              inputProps={{ min: 5 }}
              helperText="Minimálně 5 sekund"
            />
          </Grid>

          {settings.currentView === 'BEER_PONG' && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="tournament-label">Turnaj Beer Pong</InputLabel>
                <Select
                  labelId="tournament-label"
                  label="Turnaj Beer Pong"
                  value={settings.selectedBeerPongEventId || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      selectedBeerPongEventId: e.target.value || null,
                    })
                  }
                  disabled={loadingTournaments}
                >
                  <MenuItem value="">
                    <em>Žádný (zobrazí všechny aktivní turnaje)</em>
                  </MenuItem>
                  {beerPongTournaments.map((tournament) => (
                    <MenuItem key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {loadingTournaments && (
                <Box display="flex" justifyContent="center" mt={1}>
                  <CircularProgress size={20} />
                </Box>
              )}
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default LeaderboardSettingsPage;
