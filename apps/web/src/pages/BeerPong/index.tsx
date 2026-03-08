import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useTranslations } from '../../contexts/LocaleContext';
import { useDashboardHeaderSlots } from '../../contexts/DashboardChromeContext';

export function BeerPongList() {
  const navigate = useNavigate();
  const { activeEvent } = useActiveEvent();
  const t = useTranslations<Record<string, unknown>>('beerPong');
  const list = (t.list as Record<string, unknown>) || {};
  const listStats = (list.stats as Record<string, string>) || {};
  const listEmpty = (list.empty as Record<string, string>) || {};
  const noActiveEvent = (t.noActiveEvent as Record<string, string>) || {};
  const detail = (t.detail as Record<string, unknown>) || {};
  const detailStatus = (detail.status as Record<string, string>) || {};
  const [tournaments, setTournaments] = useState<BeerPongEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (!activeEvent) {
      setError((list.error as string) ?? 'Nepodařilo se načíst turnaje');
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
      setError((err.message || (list.error as string)) ?? 'Nepodařilo se načíst turnaje');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

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
        return detailStatus.draft ?? 'Návrh';
      case 'ACTIVE':
        return detailStatus.active ?? 'Aktivní';
      case 'COMPLETED':
        return detailStatus.completed ?? 'Dokončeno';
      default:
        return status;
    }
  };

  const headerAction = useMemo(
    () => (
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleCreateTournament}
      >
        {(list.createButton as string) ?? 'Vytvořit Turnaj'}
      </Button>
    ),
    [handleCreateTournament, list.createButton],
  );
  useDashboardHeaderSlots({ action: headerAction });

  if (!activeEvent) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {noActiveEvent.title ?? 'Beer Pong Turnaje'}
        </Typography>
        <Typography color="text.secondary">
          {noActiveEvent.subtitle ?? 'Pro zobrazení beer pong turnajů prosím vyberte aktivní událost.'}
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
          {(list.title as string) ?? 'Beer Pong Turnaje'}
        </Typography>
        <Typography color="error">{error}</Typography>
        <Button variant="contained" onClick={loadTournaments} sx={{ mt: 2 }}>
          {(list.retry as string) ?? 'Zkusit znovu'}
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
            {listEmpty.title ?? 'Zatím žádné turnaje'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {listEmpty.subtitle ?? 'Vytvořte svůj první beer pong turnaj a začněte. Každý turnaj potřebuje 8 týmů (dvojic) pro začátek.'}
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateTournament}>
            {listEmpty.createButton ?? 'Vytvořit Turnaj'}
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
                        {listStats.teams ?? 'Týmy:'}
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
                          {listStats.games ?? 'Zápasy:'}
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {gameCount}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {listStats.beersPerPlayer ?? 'Piv na hráče:'}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {tournament.beersPerPlayer}
                      </Typography>
                    </Box>

                    {canStart && (
                      <Chip
                        label={listStats.readyToStart ?? 'Připraveno ke startu'}
                        color="success"
                        size="small"
                        sx={{ mt: 1, alignSelf: 'flex-start' }}
                      />
                    )}

                    {teamCount < 8 && tournament.status === 'DRAFT' && (
                      <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
                        {(listStats.moreTeamsNeeded ?? '{{count}} týmů chybí').replace('{{count}}', String(8 - teamCount))}
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
