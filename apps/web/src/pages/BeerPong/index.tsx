import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Chip,
  Paper,
  Grid,
  Add as AddIcon,
} from '@demonicka/ui';
import { beerPongService } from '../../services/beerPongService';
import { useActiveEvent } from '../../contexts/ActiveEventContext';
import { CreateTournamentDialog } from './CreateTournamentDialog';
import type { BeerPongEvent, BeerPongEventStatus } from '@demonicka/shared-types';
import translations from '../../locales/cs/beerPong.json';
import { useDashboardHeaderSlots } from '../../contexts/DashboardChromeContext';

export function BeerPongList() {
  const navigate = useNavigate();
  const { activeEvent } = useActiveEvent();
  const [tournaments, setTournaments] = useState<BeerPongEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (!activeEvent) {
      setError(translations.list.error);
      setLoading(false);
      return;
    }

    loadTournaments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEvent?.id]); // Only depend on event ID, not the whole object

  const loadTournaments = async () => {
    if (!activeEvent) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await beerPongService.getByEvent(activeEvent.id);
      setTournaments(data);
    } catch (err: any) {
      setError(err.message || translations.list.error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = () => {
    setCreateDialogOpen(true);
  };

  const handleTournamentClick = (id: string) => {
    navigate(`/dashboard/beer-pong/${id}`);
  };

  const getStatusColor = (status: BeerPongEventStatus): 'default' | 'primary' | 'success' | 'warning' => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'ACTIVE':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: BeerPongEventStatus): string => {
    switch (status) {
      case 'DRAFT':
        return translations.detail.status.draft;
      case 'ACTIVE':
        return translations.detail.status.active;
      case 'COMPLETED':
        return translations.detail.status.completed;
      default:
        return status;
    }
  };

  useDashboardHeaderSlots({
    action: (
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleCreateTournament}
      >
        {translations.list.createButton}
      </Button>
    ),
  });

  if (!activeEvent) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {translations.noActiveEvent.title}
        </Typography>
        <Typography color="text.secondary">
          {translations.noActiveEvent.subtitle}
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {translations.list.title}
        </Typography>
        <Typography color="error">{error}</Typography>
        <Button variant="contained" onClick={loadTournaments} sx={{ mt: 2 }}>
          {translations.list.retry}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      {tournaments.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {translations.list.empty.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {translations.list.empty.subtitle}
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateTournament}>
            {translations.list.empty.createButton}
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {tournaments.map((tournament) => {
            const teamCount = tournament.teams?.length || 0;
            const gameCount = tournament.games?.length || 0;
            const canStart = teamCount === 8 && tournament.status === 'DRAFT';

            return (
              <Grid item xs={12} sm={6} md={4} key={tournament.id}>
                <Paper
                  onClick={() => handleTournamentClick(tournament.id)}
                  sx={{
                    p: 3,
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Typography variant="h6" sx={{ flex: 1, mr: 1 }}>
                      {tournament.name}
                    </Typography>
                    <Chip
                      label={getStatusLabel(tournament.status)}
                      color={getStatusColor(tournament.status)}
                      size="small"
                    />
                  </Box>

                  {tournament.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {tournament.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {translations.list.stats.teams}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={canStart ? 'success.main' : teamCount === 8 ? 'primary.main' : 'text.primary'}
                      >
                        {teamCount}/8
                      </Typography>
                    </Box>

                    {tournament.status === 'ACTIVE' && gameCount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          {translations.list.stats.games}
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {gameCount}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {translations.list.stats.beersPerPlayer}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {tournament.beersPerPlayer}
                      </Typography>
                    </Box>

                    {canStart && (
                      <Chip
                        label={translations.list.stats.readyToStart}
                        color="success"
                        size="small"
                        sx={{ mt: 1, alignSelf: 'flex-start' }}
                      />
                    )}

                    {teamCount < 8 && tournament.status === 'DRAFT' && (
                      <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
                        {translations.list.stats.moreTeamsNeeded.replace('{{count}}', String(8 - teamCount))}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      <CreateTournamentDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={loadTournaments}
      />
    </Box>
  );
}
