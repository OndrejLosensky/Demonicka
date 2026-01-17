import { useEffect, useState } from 'react';
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
import { DialogContentText } from '@mui/material';
import { PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { beerPongService } from '../../services/beerPongService';
import { TeamDialog } from './TeamDialog';
import { GameDetailModal } from '../../components/BeerPong/GameDetailModal';
import { BracketSVG } from '../../components/BeerPong/BracketSVG';
import type {
  BeerPongEvent,
  BeerPongTeam,
  BeerPongEventStatus,
  BeerPongGame,
  BeerPongRound,
} from '@demonicka/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import translations from '../../locales/cs/beerPong.json';

export function BeerPongDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<BeerPongEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);
  const [startTournamentOpen, setStartTournamentOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<BeerPongGame | null>(null);

  usePageTitle(tournament ? translations.detail.pageTitle.replace('{{name}}', tournament.name) : translations.pageTitle);

  useEffect(() => {
    if (id) {
      loadTournament();
    }
  }, [id]);

  const loadTournament = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await beerPongService.getById(id);
      setTournament(data);
    } catch (err: any) {
      setError(err.message || translations.detail.errors.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!deleteTeamId || !id) return;

    try {
      await beerPongService.deleteTeam(id, deleteTeamId);
      toast.success(translations.detail.success.teamDeleted);
      setDeleteTeamId(null);
      loadTournament();
    } catch (err: any) {
      console.error('Failed to delete team:', err);
      toast.error(err.response?.data?.message || translations.detail.errors.deleteTeamFailed);
    }
  };

  const handleStartTournament = async () => {
    if (!id) return;

    try {
      await beerPongService.startTournament(id);
      toast.success(translations.detail.success.started);
      setStartTournamentOpen(false);
      loadTournament();
    } catch (err: any) {
      console.error('Failed to start tournament:', err);
      toast.error(err.response?.data?.message || translations.detail.errors.startFailed);
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
        return translations.detail.status.draft;
      case 'ACTIVE':
        return translations.detail.status.active;
      case 'COMPLETED':
        return translations.detail.status.completed;
      default:
        return status;
    }
  };

  const getRoundLabel = (round: BeerPongRound): string => {
    switch (round) {
      case 'QUARTERFINAL':
        return translations.detail.bracket.quarterfinal;
      case 'SEMIFINAL':
        return translations.detail.bracket.semifinal;
      case 'FINAL':
        return translations.detail.bracket.final;
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
          {translations.detail.errors.loadFailed}
        </Typography>
        <Typography color="error">{error || translations.detail.errors.loadFailed}</Typography>
        <Button variant="contained" onClick={() => navigate('/dashboard/beer-pong')} sx={{ mt: 2 }}>
          {translations.detail.back}
        </Button>
      </Box>
    );
  }

  const teamCount = tournament.teams?.length || 0;
  const canStart = teamCount === 8 && tournament.status === 'DRAFT';
  const canAddTeams = tournament.status === 'DRAFT' && teamCount < 8;
  const canDeleteTeams = tournament.status === 'DRAFT';

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard/beer-pong')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h4">{tournament.name}</Typography>
            <Chip
              label={getStatusLabel(tournament.status)}
              color={getStatusColor(tournament.status)}
            />
          </Box>
          {tournament.description && (
            <Typography variant="body2" color="text.secondary">
              {tournament.description}
            </Typography>
          )}
        </Box>
        {canStart && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={() => setStartTournamentOpen(true)}
          >
            {translations.detail.actions.startTournament}
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Tournament Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {translations.detail.stats.title}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {translations.detail.stats.beersPerPlayer}:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {tournament.beersPerPlayer}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {translations.detail.stats.timeWindow}:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {tournament.timeWindowMinutes} min
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {translations.detail.stats.undoWindow}:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {tournament.undoWindowMinutes} min
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {translations.detail.stats.cancellationPolicy}:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {tournament.cancellationPolicy === 'KEEP_BEERS' ? translations.createDialog.cancellationPolicy.keepBeers : translations.createDialog.cancellationPolicy.removeBeers}
                </Typography>
              </Box>
              {tournament.startedAt && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    {translations.detail.stats.started}:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {new Date(tournament.startedAt).toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Team Management */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                {translations.detail.teams.title} ({teamCount}/8)
              </Typography>
              {canAddTeams && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setTeamDialogOpen(true)}
                  size="small"
                >
                  {translations.detail.actions.addTeam}
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
                  {translations.detail.teams.empty}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {translations.detail.teams.emptySubtitle}
                </Typography>
                {canAddTeams && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setTeamDialogOpen(true)}
                  >
                    {translations.detail.actions.addTeam}
                  </Button>
                )}
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
                      <Typography variant="body2" color="text.secondary">
                        {translations.detail.teams.player1}: {team.player1?.username || team.player1?.name || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {translations.detail.teams.player2}: {team.player2?.username || team.player2?.name || 'N/A'}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}

            {teamCount < 8 && tournament.status === 'DRAFT' && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>{8 - teamCount}</strong> {translations.detail.teams.moreTeamsNeeded}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* SVG Bracket Visualization */}
        {tournament.status !== 'DRAFT' && tournament.games && tournament.games.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {translations.detail.bracket.title}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <BracketSVG games={tournament.games} onGameClick={setSelectedGame} />
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Fallback games list if no games exist yet */}
        {tournament.status !== 'DRAFT' && (!tournament.games || tournament.games.length === 0) && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {translations.detail.bracket.title}
              </Typography>
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
                  {translations.detail.games.noGames}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>

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
        <DialogTitle>{translations.detail.deleteTeamDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {translations.detail.deleteTeamDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTeamId(null)}>{translations.detail.deleteTeamDialog.cancel}</Button>
          <Button onClick={handleDeleteTeam} color="error" variant="contained">
            {translations.detail.deleteTeamDialog.confirm}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={startTournamentOpen}
        onClose={() => setStartTournamentOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{translations.detail.startDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {translations.detail.startDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartTournamentOpen(false)}>{translations.detail.startDialog.cancel}</Button>
          <Button onClick={handleStartTournament} color="primary" variant="contained">
            {translations.detail.startDialog.confirm}
          </Button>
        </DialogActions>
      </Dialog>

      {selectedGame && tournament && (
        <GameDetailModal
          open={!!selectedGame}
          onClose={() => setSelectedGame(null)}
          onSuccess={loadTournament}
          game={selectedGame}
          tournamentBeersPerPlayer={tournament.beersPerPlayer}
          tournamentUndoWindowMinutes={tournament.undoWindowMinutes}
        />
      )}
    </Box>
  );
}
