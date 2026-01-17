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
import { beerPongService } from '../../services/beerPongService';
import { useActiveEvent } from '../../contexts/ActiveEventContext';
import { userService } from '../../services/userService';
import type { BeerPongGame, BeerPongTeam } from '@demonicka/shared-types';
import type { User } from '@demonicka/shared-types';
import translations from '../../locales/cs/beerPong.json';

interface AssignTeamDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  game: BeerPongGame | null;
  position: 'team1' | 'team2' | null;
  existingTeams: BeerPongTeam[];
  beerPongEventId: string;
}

export const AssignTeamDialog: React.FC<AssignTeamDialogProps> = ({
  open,
  onClose,
  onSuccess,
  game,
  position,
  existingTeams,
  beerPongEventId,
}) => {
  const { activeEvent } = useActiveEvent();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [createNewTeam, setCreateNewTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [player1Id, setPlayer1Id] = useState('');
  const [player2Id, setPlayer2Id] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (open && activeEvent) {
      loadUsers();
      setSelectedTeamId('');
      setCreateNewTeam(false);
      setTeamName('');
      setPlayer1Id('');
      setPlayer2Id('');
    }
  }, [open, activeEvent]);

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

      if (createNewTeam) {
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

        // Create team
        const newTeam = await beerPongService.createTeam(beerPongEventId, {
          name: teamName,
          player1Id,
          player2Id,
        });

        // Assign to position
        await beerPongService.assignTeamToPosition(game.id, newTeam.id, position);
      } else {
        // Assign existing team
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

  const getAvailableTeams = () => {
    // Teams that are not yet assigned to any game in this round
    const assignedTeamIds = new Set<string>();
    // This would need to be passed from parent, but for now we'll just show all teams
    return existingTeams.filter(team => !assignedTeamIds.has(team.id));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {createNewTeam ? translations.teamDialog.title : 'Přiřadit tým k pozici'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {!createNewTeam ? (
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
                        {team.name} ({team.player1?.username || team.player1?.name} & {team.player2?.username || team.player2?.name})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  onClick={() => setCreateNewTeam(true)}
                  disabled={isSubmitting}
                >
                  Vytvořit nový tým
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={() => setCreateNewTeam(false)}
                  disabled={isSubmitting}
                >
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
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {createNewTeam ? translations.teamDialog.buttons.create : 'Přiřadit'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
