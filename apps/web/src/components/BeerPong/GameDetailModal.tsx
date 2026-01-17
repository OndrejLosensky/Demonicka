import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
} from '@demonicka/ui';
import { toast } from 'react-hot-toast';
import { beerPongService } from '../../services/beerPongService';
import type {
  BeerPongGame,
  BeerPongGameStatus,
  BeerPongRound,
  CompleteGameDto,
} from '@demonicka/shared-types';
import translations from '../../locales/cs/beerPong.json';

interface GameDetailModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  game: BeerPongGame | null;
  tournamentBeersPerPlayer: number;
  tournamentUndoWindowMinutes: number;
}

export const GameDetailModal: React.FC<GameDetailModalProps> = ({
  open,
  onClose,
  onSuccess,
  game,
  tournamentBeersPerPlayer,
  tournamentUndoWindowMinutes,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<string>('');
  const [undoTimeRemaining, setUndoTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !game) {
      setSelectedWinner('');
      setUndoTimeRemaining(null);
      return;
    }

    // Calculate undo time remaining if game is in progress
    if (game.status === 'IN_PROGRESS' && game.beersAddedAt) {
      const updateUndoTime = () => {
        const now = Date.now();
        const addedAt = new Date(game.beersAddedAt!).getTime();
        const undoWindowMs = tournamentUndoWindowMinutes * 60 * 1000;
        const timeSinceAdded = now - addedAt;
        const remaining = undoWindowMs - timeSinceAdded;

        if (remaining > 0) {
          setUndoTimeRemaining(Math.floor(remaining / 1000)); // seconds
        } else {
          setUndoTimeRemaining(null);
        }
      };

      updateUndoTime();
      const interval = setInterval(updateUndoTime, 1000);

      return () => clearInterval(interval);
    }
  }, [open, game, tournamentUndoWindowMinutes]);

  if (!game) {
    return null;
  }

  const getStatusColor = (status: BeerPongGameStatus): 'default' | 'primary' | 'success' => {
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

  const getStatusLabel = (status: BeerPongGameStatus): string => {
    switch (status) {
      case 'PENDING':
        return translations.gameModal.status.pending;
      case 'IN_PROGRESS':
        return translations.gameModal.status.inProgress;
      case 'COMPLETED':
        return translations.gameModal.status.completed;
      default:
        return status;
    }
  };

  const getRoundLabel = (round: BeerPongRound): string => {
    switch (round) {
      case 'QUARTERFINAL':
        return translations.gameModal.round.quarterfinal;
      case 'SEMIFINAL':
        return translations.gameModal.round.semifinal;
      case 'FINAL':
        return translations.gameModal.round.final;
      default:
        return round;
    }
  };

  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartGame = async () => {
    if (!game) return;

    try {
      setIsSubmitting(true);
      await beerPongService.startGame(game.id);
      toast.success(translations.gameModal.success.started);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to start game:', error);
      toast.error(error.response?.data?.message || translations.gameModal.errors.startFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteGame = async () => {
    if (!game || !selectedWinner) return;

    try {
      setIsSubmitting(true);
      await beerPongService.completeGame(game.id, {
        winnerTeamId: selectedWinner,
      });
      toast.success(translations.gameModal.success.completed);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to complete game:', error);
      toast.error(error.response?.data?.message || translations.gameModal.errors.completeFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndo = async () => {
    if (!game) return;

    if (!window.confirm(translations.gameModal.actions.undoStart + '? ' + translations.gameModal.errors.undoFailed)) {
      return;
    }

    try {
      setIsSubmitting(true);
      await beerPongService.undoGameStart(game.id);
      toast.success(translations.gameModal.success.undo);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to undo game start:', error);
      toast.error(error.response?.data?.message || translations.gameModal.errors.undoFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canUndo = game.status === 'IN_PROGRESS' && undoTimeRemaining !== null && undoTimeRemaining > 0;

  const team1Name = game.team1?.name || 'Team 1';
  const team2Name = game.team2?.name || 'Team 2';
  const team1Player1 = game.team1?.player1?.username || game.team1?.player1?.name || 'Player 1';
  const team1Player2 = game.team1?.player2?.username || game.team1?.player2?.name || 'Player 2';
  const team2Player1 = game.team2?.player1?.username || game.team2?.player1?.name || 'Player 1';
  const team2Player2 = game.team2?.player2?.username || game.team2?.player2?.name || 'Player 2';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{getRoundLabel(game.round)}</Typography>
          <Chip
            label={getStatusLabel(game.status)}
            color={getStatusColor(game.status)}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Teams */}
          <Paper sx={{ p: 2, bgcolor: 'action.hover' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {team1Name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {team1Player1} & {team1Player2}
                </Typography>
              </Box>
              {game.winnerTeamId === game.team1Id && (
                <Chip label={translations.gameModal.info.winner} color="success" size="small" />
              )}
            </Box>
          </Paper>

          <Box sx={{ textAlign: 'center', my: 1 }}>
            <Typography variant="h6" color="text.secondary">
              VS
            </Typography>
          </Box>

          <Paper sx={{ p: 2, bgcolor: 'action.hover' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {team2Name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {team2Player1} & {team2Player2}
                </Typography>
              </Box>
              {game.winnerTeamId === game.team2Id && (
                <Chip label={translations.gameModal.info.winner} color="success" size="small" />
              )}
            </Box>
          </Paper>

          <Divider />

          {/* Game Info */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {game.startedAt && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {translations.gameModal.info.startedAt}:
                </Typography>
                <Typography variant="body2">
                  {new Date(game.startedAt).toLocaleString()}
                </Typography>
              </Box>
            )}
            {game.endedAt && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {translations.gameModal.info.endedAt}:
                </Typography>
                <Typography variant="body2">
                  {new Date(game.endedAt).toLocaleString()}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Undo timer */}
          {canUndo && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'warning.light',
                borderRadius: 1,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {translations.gameModal.info.undoTimeRemaining.replace('{{time}}', formatTimeRemaining(undoTimeRemaining!))}
              </Typography>
            </Box>
          )}

          {/* Mark Winner (when in progress) */}
          {game.status === 'IN_PROGRESS' && !game.winnerTeamId && (
            <FormControl fullWidth>
              <InputLabel>{translations.gameModal.completeGame.selectWinner}</InputLabel>
              <Select
                value={selectedWinner}
                label={translations.gameModal.completeGame.selectWinner}
                onChange={(e) => setSelectedWinner(e.target.value)}
                disabled={isSubmitting}
              >
                <MenuItem value={game.team1Id}>
                  {team1Name} ({team1Player1} & {team1Player2})
                </MenuItem>
                <MenuItem value={game.team2Id}>
                  {team2Name} ({team2Player1} & {team2Player2})
                </MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        {game.status === 'PENDING' && (
          <>
            <Button onClick={onClose} disabled={isSubmitting}>
              {translations.gameModal.actions.close}
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartGame}
              disabled={isSubmitting}
            >
              {translations.gameModal.actions.startGame}
            </Button>
          </>
        )}

        {game.status === 'IN_PROGRESS' && !game.winnerTeamId && (
          <>
            {canUndo && (
              <Button
                variant="outlined"
                color="warning"
                onClick={handleUndo}
                disabled={isSubmitting}
              >
                {translations.gameModal.actions.undoStart}
              </Button>
            )}
            <Button onClick={onClose} disabled={isSubmitting}>
              {translations.gameModal.actions.close}
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleCompleteGame}
              disabled={isSubmitting || !selectedWinner}
            >
              {translations.gameModal.actions.completeGame}
            </Button>
          </>
        )}

        {game.status === 'COMPLETED' && (
          <Button onClick={onClose} variant="contained">
            {translations.gameModal.actions.close}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
