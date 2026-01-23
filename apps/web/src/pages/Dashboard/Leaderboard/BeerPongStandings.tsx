import { useState, useEffect } from 'react';
import { Typography, Box, Paper, CircularProgress, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { FaBeer } from 'react-icons/fa';
import { BracketSVG } from '../../../components/BeerPong/BracketSVG';
import { beerPongService } from '../../../services/beerPongService';
import type { BeerPongEvent } from '@demonicka/shared-types';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { useLeaderboardViewSettings } from './useLeaderboardViewSettings';

interface BeerPongStandingsProps {
  selectedTournamentId?: string | null;
  preloadedTournaments?: BeerPongEvent[];
}

export const BeerPongStandings: React.FC<BeerPongStandingsProps> = ({ 
  selectedTournamentId,
  preloadedTournaments 
}) => {
  const { activeEvent } = useActiveEvent();
  const { settings } = useLeaderboardViewSettings();
  const [tournaments, setTournaments] = useState<BeerPongEvent[]>(preloadedTournaments || []);
  const [loading, setLoading] = useState(!preloadedTournaments);
  const [selectedId, setSelectedId] = useState<string | null>(selectedTournamentId || null);

  useEffect(() => {
    // If we have preloaded tournaments, use them and skip loading
    if (preloadedTournaments && preloadedTournaments.length > 0) {
      setTournaments(preloadedTournaments);
      setLoading(false);
      
      // Auto-select tournament if specified in settings or if only one tournament
      if (selectedTournamentId) {
        setSelectedId(selectedTournamentId);
      } else if (preloadedTournaments.length === 1) {
        setSelectedId(preloadedTournaments[0].id);
      } else if (settings?.selectedBeerPongEventId) {
        const found = preloadedTournaments.find((t) => t.id === settings.selectedBeerPongEventId);
        if (found) {
          setSelectedId(found.id);
        }
      }
      return;
    }

    // Otherwise load from API
    const loadTournaments = async () => {
      if (!activeEvent?.id) {
        setTournaments([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await beerPongService.getActiveTournaments(activeEvent.id);
        setTournaments(data);

        // Auto-select tournament if specified in settings or if only one tournament
        if (selectedTournamentId) {
          setSelectedId(selectedTournamentId);
        } else if (data.length === 1) {
          setSelectedId(data[0].id);
        } else if (settings?.selectedBeerPongEventId) {
          const found = data.find((t) => t.id === settings.selectedBeerPongEventId);
          if (found) {
            setSelectedId(found.id);
          }
        }
      } catch (error) {
        console.error('Failed to load beer pong tournaments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTournaments();
  }, [activeEvent?.id, selectedTournamentId, settings?.selectedBeerPongEventId, preloadedTournaments]);

  const selectedTournament = tournaments.find((t) => t.id === selectedId);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (tournaments.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          height: '100%',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <FaBeer style={{ fontSize: '1.5rem' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.3rem' }}>
            Beer Pong Turnaje
          </Typography>
        </Box>
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary" variant="body1">
            Žádné aktivní turnaje
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <FaBeer style={{ fontSize: '1.5rem' }} />
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.3rem' }}>
          Beer Pong Turnaje
        </Typography>
      </Box>

      {tournaments.length > 1 && (
        <Box mb={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="tournament-select-label">Vybrat turnaj</InputLabel>
            <Select
              labelId="tournament-select-label"
              label="Vybrat turnaj"
              value={selectedId || ''}
              onChange={(e) => setSelectedId(e.target.value || null)}
            >
              {tournaments.map((tournament) => (
                <MenuItem key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {selectedTournament ? (
        <Box>
          <Typography variant="h6" gutterBottom>
            {selectedTournament.name}
          </Typography>
          {selectedTournament.description && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {selectedTournament.description}
            </Typography>
          )}
          <Box mt={3}>
            <BracketSVG 
              games={selectedTournament.games || []} 
              onGameClick={() => {}} 
              canEdit={false}
            />
          </Box>
        </Box>
      ) : (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary" variant="body1">
            Vyberte turnaj
          </Typography>
        </Box>
      )}
    </Paper>
  );
};
