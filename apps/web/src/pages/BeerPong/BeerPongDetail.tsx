import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Chip,
  Paper,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from '@demonicka/ui';
import { DialogContentText, Tabs, Tab } from '@mui/material';
import { PlayArrow as PlayArrowIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { beerPongService } from '../../services/beerPongService';
import { TeamDialog } from './TeamDialog';
import { GameDetailModal } from '../../components/BeerPong/GameDetailModal';
import { BracketSVG } from '../../components/BeerPong/BracketSVG';
import { AssignTeamDialog } from '../../components/BeerPong/AssignTeamDialog';
import { UserAvatar } from '../../components/UserAvatar';
import type {
  BeerPongEvent,
  BeerPongTeam,
  BeerPongEventStatus,
  BeerPongGame,
  BeerPongRound,
} from '@demonicka/shared-types';
import { useTranslations } from '../../contexts/LocaleContext';
import { useAuth } from '../../contexts/AuthContext';
import { Permission } from '@demonicka/shared';
import { useDashboardHeaderSlots } from '../../contexts/DashboardChromeContext';

export function BeerPongDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const t = useTranslations<Record<string, unknown>>('beerPong');
  const detailT = (t.detail as Record<string, unknown>) || {};
  const detailErrors = (detailT.errors as Record<string, string>) || {};
  const detailSuccess = (detailT.success as Record<string, string>) || {};
  const detailStatus = (detailT.status as Record<string, string>) || {};
  const detailActions = (detailT.actions as Record<string, string>) || {};
  const detailTabs = (detailT.tabs as Record<string, string>) || {};
  const detailTeams = (detailT.teams as Record<string, string>) || {};
  const detailBracket = (detailT.bracket as Record<string, string>) || {};
  const detailGames = (detailT.games as Record<string, string>) || {};
  const detailStats = (detailT.stats as Record<string, string>) || {};
  const detailDeleteTeamDialog = (detailT.deleteTeamDialog as Record<string, string>) || {};
  const detailStartDialog = (detailT.startDialog as Record<string, string>) || {};
  const detailCompleteDialog = (detailT.completeDialog as Record<string, string>) || {};
  const createDialogT = (t.createDialog as Record<string, unknown>) || {};
  const cancellationPolicyT = (createDialogT.cancellationPolicy as Record<string, string>) || {};
  const [tournament, setTournament] = useState<BeerPongEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);
  const [startTournamentOpen, setStartTournamentOpen] = useState(false);
  const [completeTournamentOpen, setCompleteTournamentOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<BeerPongGame | null>(null);
  const [assignTeamDialogOpen, setAssignTeamDialogOpen] = useState(false);
  const [assignPosition, setAssignPosition] = useState<'team1' | 'team2' | null>(null);
  const [activeTab, setActiveTab] = useState(0); // 0 = Map, 1 = Teams, 2 = Settings
  const [deleteTournamentOpen, setDeleteTournamentOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadTournament();
    }
  }, [id]);

  const loadTournament = async () => {
    console.log('[BeerPong loadTournament] called, id=', id);
    if (!id) {
      console.log('[BeerPong loadTournament] no id, returning');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[BeerPong loadTournament] calling getById');
      const data = await beerPongService.getById(id);
      console.log('[BeerPong loadTournament] getById success, data.games?.length=', data?.games?.length ?? 'n/a');
      setTournament(data);
    } catch (err: any) {
      console.log('[BeerPong loadTournament] getById FAILED:', err?.message, err?.response?.status, err?.response?.data);
      setError(err.message || (detailErrors.loadFailed ?? 'Nepodařilo se načíst turnaj'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!deleteTeamId || !id) return;

    try {
      await beerPongService.deleteTeam(id, deleteTeamId);
      toast.success(detailSuccess.teamDeleted ?? 'Tým byl úspěšně smazán');
      setDeleteTeamId(null);
      loadTournament();
    } catch (err: any) {
      console.error('Failed to delete team:', err);
      toast.error((err.response?.data?.message || detailErrors.deleteTeamFailed) ?? 'Nepodařilo se smazat tým');
    }
  };

  const handleStartTournament = async () => {
    if (!id) return;

    try {
      await beerPongService.startTournament(id);
      toast.success(detailSuccess.started ?? 'Turnaj spuštěn!');
      setStartTournamentOpen(false);
      loadTournament();
    } catch (err: any) {
      console.error('Failed to start tournament:', err);
      toast.error((err.response?.data?.message || detailErrors.startFailed) ?? 'Nepodařilo se spustit turnaj');
    }
  };

  const handleCompleteTournament = async () => {
    if (!id) return;

    try {
      await beerPongService.completeTournament(id);
      toast.success(detailSuccess.completed || 'Tournament completed successfully');
      setCompleteTournamentOpen(false);
      loadTournament();
    } catch (err: any) {
      console.error('Failed to complete tournament:', err);
      toast.error(err.response?.data?.message || detailErrors.completeFailed || 'Failed to complete tournament');
    }
  };

  const handleDeleteTournament = async () => {
    if (!id) return;

    try {
      setIsDeleting(true);
      await beerPongService.delete(id);
      toast.success('Turnaj byl úspěšně smazán');
      navigate('/dashboard/beer-pong');
    } catch (err: any) {
      console.error('Failed to delete tournament:', err);
      toast.error(err.response?.data?.message || 'Nepodařilo se smazat turnaj');
    } finally {
      setIsDeleting(false);
      setDeleteTournamentOpen(false);
    }
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
        return detailStatus.draft;
      case 'ACTIVE':
        return detailStatus.active;
      case 'COMPLETED':
        return detailStatus.completed;
      default:
        return status;
    }
  };

  const getRoundLabel = (round: BeerPongRound): string => {
    switch (round) {
      case 'QUARTERFINAL':
        return detailBracket.quarterfinal;
      case 'SEMIFINAL':
        return detailBracket.semifinal;
      case 'FINAL':
        return detailBracket.final;
      default:
        return round;
    }
  };

  const getGameStatusColor = (status: string): 'default' | 'primary' | 'success' => {
    switch (status) {
      case 'PENDING':
        return 'default';
      case 'IN_PROGRESS':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      default:
        return 'default';
    }
  };

  const getGameStatusLabel = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      default:
        return status;
    }
  };

  const teamCount = tournament?.teams?.length || 0;
  const canStart = Boolean(tournament && teamCount === 8 && tournament.status === 'DRAFT');
  const canAddTeams = Boolean(tournament && tournament.status === 'DRAFT' && teamCount < 8);
  const canDeleteTeams = Boolean(tournament && tournament.status === 'DRAFT');
  const canComplete = Boolean(
    tournament &&
      tournament.status === 'ACTIVE' &&
      tournament.games?.some((g) => g.round === 'FINAL' && g.winnerTeamId),
  );
  const canDeleteTournament = Boolean(
    tournament &&
      hasPermission([Permission.DELETE_BEER_PONG_EVENT]) &&
      tournament.status !== 'ACTIVE',
  );

  const headerLeft = useMemo(
    () =>
      tournament ? (
        <Chip
          label={getStatusLabel(tournament.status)}
          color={getStatusColor(tournament.status)}
        />
      ) : undefined,
    [tournament?.status],
  );

  const headerAction = useMemo(
    () => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/dashboard/beer-pong')}>
          <ArrowBackIcon />
        </IconButton>
        {canDeleteTournament && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteTournamentOpen(true)}
          >
            Smazat turnaj
          </Button>
        )}
        {canStart && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={() => setStartTournamentOpen(true)}
          >
            {detailActions.startTournament}
          </Button>
        )}
        {canComplete && (
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => setCompleteTournamentOpen(true)}
          >
            {detailActions.completeTournament || 'Dokončit Turnaj'}
          </Button>
        )}
      </Box>
    ),
    [
      navigate,
      canDeleteTournament,
      canStart,
      canComplete,
      detailActions.startTournament,
      detailActions.completeTournament,
    ],
  );

  useDashboardHeaderSlots({ left: headerLeft, action: headerAction });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !tournament) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {detailErrors.loadFailed}
        </Typography>
        <Typography color="error">{error || detailErrors.loadFailed}</Typography>
        <Button variant="contained" onClick={() => navigate('/dashboard/beer-pong')} sx={{ mt: 2 }}>
          {(detailT.back as string) ?? 'Zpět'}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      {tournament.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {tournament.description}
        </Typography>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label={detailTabs.map ?? 'Mapa'} />
          <Tab label={detailTabs.teams ?? 'Týmy'} />
          <Tab label={detailTabs.settings ?? 'Nastavení'} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {/* Map/Bracket Tab */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {detailBracket.title ?? 'Pavouk'}
            </Typography>
            <Box sx={{ mt: 2 }}>
              {tournament.games && tournament.games.length > 0 ? (
                <BracketSVG 
                  games={tournament.games} 
                  onGameClick={setSelectedGame}
                  onSlotClick={(game, position) => {
                    setSelectedGame(game);
                    setAssignPosition(position);
                    setAssignTeamDialogOpen(true);
                  }}
                  canEdit={tournament.status === 'DRAFT'}
                />
              ) : (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'action.hover',
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    {detailGames.noGames ?? 'Zatím žádné zápasy'}
                  </Typography>
                  {tournament.status === 'DRAFT' && (
                    <Button
                      variant="outlined"
                      onClick={async () => {
                        try {
                          await loadTournament();
                        } catch (err) {
                          console.error('Failed to reload:', err);
                        }
                      }}
                      sx={{ mt: 2 }}
                    >
                      Obnovit
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          {/* Teams Tab */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                {detailTeams.title ?? 'Týmy'} ({teamCount}/8)
              </Typography>
              {canAddTeams && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setTeamDialogOpen(true)}
                  size="small"
                >
                  {detailActions.addTeam ?? 'Přidat Tým'}
                </Button>
              )}
            </Box>

            {teamCount === 0 ? (
              <Box
                sx={{
                  p: 4,
                  textAlign: 'center',
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {detailTeams.empty ?? 'Zatím žádné týmy'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {detailTeams.emptySubtitle ?? 'Přidejte týmy pro spuštění turnaje.'}
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {tournament.teams?.map((team) => (
                  <Grid item xs={12} sm={6} key={team.id}>
                    <Paper
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        position: 'relative',
                      }}
                    >
                      {canDeleteTeams && (
                        <IconButton
                          size="small"
                          onClick={() => setDeleteTeamId(team.id)}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: 'error.main',
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, pr: 4 }}>
                        {team.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        {team.player1 && <UserAvatar user={team.player1} sx={{ width: 24, height: 24, fontSize: '0.75rem' }} />}
                        <Typography variant="body2" color="text.secondary">
                          {detailTeams.player1 ?? 'Hráč 1'}: {team.player1?.username || team.player1?.name || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {team.player2 && <UserAvatar user={team.player2} sx={{ width: 24, height: 24, fontSize: '0.75rem' }} />}
                        <Typography variant="body2" color="text.secondary">
                          {detailTeams.player2 ?? 'Hráč 2'}: {team.player2?.username || team.player2?.name || 'N/A'}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}

            {teamCount < 8 && tournament.status === 'DRAFT' && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>{8 - teamCount}</strong> {detailTeams.moreTeamsNeeded ?? 'týmů chybí pro spuštění turnaje'}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          {/* Settings Tab */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {detailStats.title ?? 'Nastavení turnaje'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {detailStats.beersPerPlayer ?? 'Piv na hráče'}:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {tournament.beersPerPlayer}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {detailStats.timeWindow ?? 'Časové okno'}:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {tournament.timeWindowMinutes} min
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {detailStats.undoWindow ?? 'Okno pro zrušení'}:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {tournament.undoWindowMinutes} min
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {detailStats.cancellationPolicy ?? 'Politika zrušení'}:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {tournament.cancellationPolicy === 'KEEP_BEERS' ? cancellationPolicyT.keepBeers : cancellationPolicyT.removeBeers}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Velikost piva:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {tournament.beerSize === 'SMALL' ? 'Malé' : 'Velké'} ({tournament.beerVolumeLitres || 0.5} L)
                    </Typography>
                  </Box>
                  {tournament.startedAt && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {detailStats.started ?? 'Spuštěno'}:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {new Date(tournament.startedAt).toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                  {tournament.completedAt && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {detailStats.completed ?? 'Dokončeno'}:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {new Date(tournament.completedAt).toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Dialogs */}
      <TeamDialog
        open={teamDialogOpen}
        onClose={() => setTeamDialogOpen(false)}
        onSuccess={loadTournament}
        beerPongEventId={id!}
        existingTeams={tournament.teams || []}
      />

      <Dialog
        open={!!deleteTeamId}
        onClose={() => setDeleteTeamId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{detailDeleteTeamDialog.title ?? 'Smazat Tým'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {detailDeleteTeamDialog.message ?? 'Opravdu chcete smazat tento tým?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTeamId(null)}>{detailDeleteTeamDialog.cancel ?? 'Zrušit'}</Button>
          <Button onClick={handleDeleteTeam} color="error" variant="contained">
            {detailDeleteTeamDialog.confirm ?? 'Smazat'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={startTournamentOpen}
        onClose={() => setStartTournamentOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{detailStartDialog.title ?? 'Spustit Turnaj'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {detailStartDialog.message ?? 'Opravdu chcete spustit turnaj?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartTournamentOpen(false)}>{detailStartDialog.cancel ?? 'Zrušit'}</Button>
          <Button onClick={handleStartTournament} color="primary" variant="contained">
            {detailStartDialog.confirm ?? 'Spustit'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={completeTournamentOpen}
        onClose={() => setCompleteTournamentOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{detailCompleteDialog.title ?? 'Dokončit Turnaj'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {detailCompleteDialog.message ?? 'Opravdu chcete dokončit turnaj? Tato akce je nevratná.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteTournamentOpen(false)}>{detailCompleteDialog.cancel ?? 'Zrušit'}</Button>
          <Button onClick={handleCompleteTournament} color="success" variant="contained">
            {detailCompleteDialog.confirm ?? 'Dokončit'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteTournamentOpen}
        onClose={() => !isDeleting && setDeleteTournamentOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Smazat turnaj</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Opravdu chcete smazat turnaj "{tournament.name}"? Tato akce je nevratná a smaže všechny související data. Aktivní turnaje nelze smazat.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTournamentOpen(false)} disabled={isDeleting}>
            Zrušit
          </Button>
          <Button
            onClick={handleDeleteTournament}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? 'Maže se...' : 'Smazat'}
          </Button>
        </DialogActions>
      </Dialog>

      {selectedGame && tournament && (
        <GameDetailModal
          open={!!selectedGame && !assignTeamDialogOpen}
          onClose={() => setSelectedGame(null)}
          onSuccess={loadTournament}
          game={selectedGame}
          tournamentBeersPerPlayer={tournament.beersPerPlayer}
          tournamentUndoWindowMinutes={tournament.undoWindowMinutes}
        />
      )}

      {selectedGame && assignPosition && tournament && (
        <AssignTeamDialog
          open={assignTeamDialogOpen}
          onClose={() => {
            setAssignTeamDialogOpen(false);
            setAssignPosition(null);
            setSelectedGame(null);
          }}
          onSuccess={loadTournament}
          game={selectedGame}
          position={assignPosition}
          existingTeams={tournament.teams || []}
          beerPongEventId={id!}
          eventId={tournament.eventId}
        />
      )}
    </Box>
  );
}
