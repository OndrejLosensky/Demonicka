import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  TextField,
} from '@demonicka/ui';
import { toast } from 'react-hot-toast';
import { beerPongService, eventBeerPongTeamService } from '../../services/beerPongService';
import { useActiveEvent } from '../../contexts/ActiveEventContext';
import { userService } from '../../services/userService';
import type { BeerPongGame, BeerPongTeam, EventBeerPongTeam } from '@demonicka/shared-types';
import type { User } from '@demonicka/shared-types';
import translations from '../../locales/cs/beerPong.json';

type AssignMode = 'select' | 'create' | 'fromEvent';

interface AssignTeamDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  game: BeerPongGame | null;
  position: 'team1' | 'team2' | null;
  existingTeams: BeerPongTeam[];
  beerPongEventId: string;
  eventId: string;
}

function formatPlayerName(p: { username?: string; name?: string; firstName?: string; lastName?: string } | null | undefined): string {
  if (!p) return 'N/A';
  return p.username || p.name || [p.firstName, p.lastName].filter(Boolean).join(' ').trim() || 'N/A';
}

export const AssignTeamDialog: React.FC<AssignTeamDialogProps> = ({
  open,
  onClose,
  onSuccess,
  game,
  position,
  existingTeams,
  beerPongEventId,
  eventId,
}) => {
  const { activeEvent } = useActiveEvent();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<AssignMode>('select');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedEventTeamId, setSelectedEventTeamId] = useState<string>('');
  const [teamName, setTeamName] = useState('');
  const [player1Id, setPlayer1Id] = useState('');
  const [player2Id, setPlayer2Id] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [eventTeams, setEventTeams] = useState<EventBeerPongTeam[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingEventTeams, setLoadingEventTeams] = useState(false);

  useEffect(() => {
    if (open && activeEvent) {
      loadUsers();
      loadEventTeams();
      setSelectedTeamId('');
      setSelectedEventTeamId('');
      setMode('select');
      setTeamName('');
      setPlayer1Id('');
      setPlayer2Id('');
    }
  }, [open, activeEvent, eventId]);

  const loadUsers = async () => {
    if (!activeEvent) return;

    try {
      setLoadingUsers(true);
      const eventUsers = await userService.getByEvent(activeEvent.id);
      setUsers(eventUsers);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      toast.error(translations.teamDialog.errors.loadUsersFailed);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadEventTeams = async () => {
    if (!eventId) return;
    try {
      setLoadingEventTeams(true);
      const teams = await eventBeerPongTeamService.getByEvent(eventId);
      setEventTeams(teams);
    } catch (error: any) {
      // ignore
    } finally {
      setLoadingEventTeams(false);
    }
  };

  const getAvailableUsers = (excludeId?: string) => {
    // Get all users already in teams (cannot be in multiple teams)
    const usedUserIds = new Set(
      existingTeams.flatMap((team) => [team.player1Id, team.player2Id]),
    );

    return users.filter((user) => {
      if (excludeId && user.id === excludeId) return false;
      return !usedUserIds.has(user.id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!game || !position) return;

    try {
      setIsSubmitting(true);

      if (mode === 'create') {
        // Create new team and assign it
        if (!teamName.trim()) {
          toast.error(translations.teamDialog.errors.nameRequired);
          return;
        }
        if (!player1Id || !player2Id) {
          toast.error(translations.teamDialog.errors.selectPlayer1);
          return;
        }
        if (player1Id === player2Id) {
          toast.error(translations.teamDialog.errors.playersDifferent);
          return;
        }

        const newTeam = await beerPongService.createTeam(beerPongEventId, {
          name: teamName,
          player1Id,
          player2Id,
        });
        await beerPongService.assignTeamToPosition(game.id, newTeam.id, position);
      } else if (mode === 'fromEvent') {
        // Add from event pool and assign
        if (!selectedEventTeamId) {
          toast.error('Prosím vyberte tým z event poolu');
          return;
        }
        const newTeam = await beerPongService.addTeamFromEvent(beerPongEventId, selectedEventTeamId);
        await beerPongService.assignTeamToPosition(game.id, newTeam.id, position);
      } else {
        // Assign existing tournament team
        if (!selectedTeamId) {
          toast.error('Prosím vyberte tým');
          return;
        }
        await beerPongService.assignTeamToPosition(game.id, selectedTeamId, position);
      }

      toast.success(translations.teamDialog.success);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to assign team:', error);
      toast.error(error.response?.data?.message || 'Nepodařilo se přiřadit tým');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableTeams = () => existingTeams;

  const getAvailableEventTeams = () => {
    const existingNames = new Set(existingTeams.map(t => t.name.toLowerCase()));
    const existingPairs = new Set(existingTeams.map(t => `${t.player1Id}-${t.player2Id}`));
    return eventTeams.filter(et =>
      !existingNames.has(et.name.toLowerCase()) &&
      !existingPairs.has(`${et.player1Id}-${et.player2Id}`)
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {mode === 'create' ? translations.teamDialog.title : 'Přiřadit tým k pozici'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {mode === 'select' && (
              <>
                <FormControl fullWidth required disabled={isSubmitting}>
                  <InputLabel>Vybrat tým</InputLabel>
                  <Select
                    value={selectedTeamId}
                    label="Vybrat tým"
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                  >
                    {getAvailableTeams().map((team) => (
                      <MenuItem key={team.id} value={team.id}>
                        {team.name} ({formatPlayerName(team.player1)} & {formatPlayerName(team.player2)})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  onClick={() => setMode('create')}
                  disabled={isSubmitting}
                >
                  Vytvořit nový tým
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setMode('fromEvent')}
                  disabled={isSubmitting || loadingEventTeams}
                >
                  Přidat z event poolu
                </Button>
              </>
            )}

            {mode === 'fromEvent' && (
              <>
                <Button variant="outlined" onClick={() => setMode('select')} disabled={isSubmitting}>
                  Zpět na výběr
                </Button>
                {loadingEventTeams ? (
                  <Box sx={{ py: 2, textAlign: 'center' }}>Načítání týmů z event poolu...</Box>
                ) : getAvailableEventTeams().length === 0 ? (
                  <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    V event poolu nejsou žádné dostupné týmy.
                  </Box>
                ) : (
                  <FormControl fullWidth required disabled={isSubmitting}>
                    <InputLabel>Vybrat tým z event poolu</InputLabel>
                    <Select
                      value={selectedEventTeamId}
                      label="Vybrat tým z event poolu"
                      onChange={(e) => setSelectedEventTeamId(e.target.value)}
                    >
                      {getAvailableEventTeams().map((team) => (
                        <MenuItem key={team.id} value={team.id}>
                          {team.name} ({formatPlayerName(team.player1)} & {formatPlayerName(team.player2)})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </>
            )}

            {mode === 'create' && (
              <>
                <Button variant="outlined" onClick={() => setMode('select')} disabled={isSubmitting}>
                  Vybrat existující tým
                </Button>
                <TextField
                  label={translations.teamDialog.fields.teamName}
                  fullWidth
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  disabled={isSubmitting}
                />
                <FormControl fullWidth required disabled={isSubmitting || loadingUsers}>
                  <InputLabel>{translations.teamDialog.fields.player1}</InputLabel>
                  <Select
                    value={player1Id}
                    label={translations.teamDialog.fields.player1}
                    onChange={(e) => setPlayer1Id(e.target.value)}
                  >
                    {getAvailableUsers(player2Id).map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.username || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth required disabled={isSubmitting || loadingUsers}>
                  <InputLabel>{translations.teamDialog.fields.player2}</InputLabel>
                  <Select
                    value={player2Id}
                    label={translations.teamDialog.fields.player2}
                    onChange={(e) => setPlayer2Id(e.target.value)}
                  >
                    {getAvailableUsers(player1Id).map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.username || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            {translations.teamDialog.buttons.cancel}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={
              isSubmitting ||
              (mode === 'select' && !selectedTeamId) ||
              (mode === 'fromEvent' && !selectedEventTeamId)
            }
          >
            {mode === 'create' ? translations.teamDialog.buttons.create : 'Přiřadit'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
