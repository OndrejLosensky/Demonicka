import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@demonicka/ui';
import { toast } from 'react-hot-toast';
import { beerPongService, eventBeerPongTeamService } from '../../services/beerPongService';
import { useActiveEvent } from '../../contexts/ActiveEventContext';
import { userService } from '../../services/userService';
import type { CreateTeamDto, BeerPongTeam, EventBeerPongTeam } from '@demonicka/shared-types';
import type { User } from '@demonicka/shared-types';
import translations from '../../locales/cs/beerPong.json';

interface TeamDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  beerPongEventId: string;
  existingTeams?: BeerPongTeam[];
}

export const TeamDialog: React.FC<TeamDialogProps> = ({
  open,
  onClose,
  onSuccess,
  beerPongEventId,
  existingTeams = [],
}) => {
  const { activeEvent } = useActiveEvent();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [eventTeams, setEventTeams] = useState<EventBeerPongTeam[]>([]);
  const [loadingEventTeams, setLoadingEventTeams] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = Create New, 1 = Add from Event
  const [selectedEventTeamId, setSelectedEventTeamId] = useState<string>('');
  const [formData, setFormData] = useState<CreateTeamDto>({
    name: '',
    player1Id: '',
    player2Id: '',
  });
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (open && activeEvent) {
      loadUsers();
      loadEventTeams();
      setFormData({
        name: '',
        player1Id: '',
        player2Id: '',
      });
      setSelectedEventTeamId('');
      setNameError('');
      setActiveTab(0);
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

  const loadEventTeams = async () => {
    if (!activeEvent) return;

    try {
      setLoadingEventTeams(true);
      const teams = await eventBeerPongTeamService.getByEvent(activeEvent.id);
      setEventTeams(teams);
    } catch (error: any) {
      console.error('Failed to load event teams:', error);
      // Don't show error toast - event teams might not exist yet
    } finally {
      setLoadingEventTeams(false);
    }
  };

  const validateForm = (): boolean => {
    let valid = true;

    if (!formData.name.trim()) {
      setNameError(translations.teamDialog.errors.nameRequired);
      valid = false;
    } else {
      // Check if team name is unique
      const nameExists = existingTeams.some(
        (team) => team.name.toLowerCase() === formData.name.trim().toLowerCase(),
      );
      if (nameExists) {
        setNameError(translations.teamDialog.errors.nameExists);
        valid = false;
      } else {
        setNameError('');
      }
    }

    if (!formData.player1Id) {
      toast.error(translations.teamDialog.errors.selectPlayer1);
      valid = false;
    }

    if (!formData.player2Id) {
      toast.error(translations.teamDialog.errors.selectPlayer2);
      valid = false;
    }

    if (formData.player1Id === formData.player2Id) {
      toast.error(translations.teamDialog.errors.playersDifferent);
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 0) {
      // Create new team
      if (!validateForm()) {
        return;
      }

      try {
        setIsSubmitting(true);
        await beerPongService.createTeam(beerPongEventId, formData);
        toast.success(translations.teamDialog.success);
        onSuccess();
        onClose();
      } catch (error: any) {
        console.error('Failed to create team:', error);
        toast.error(error.response?.data?.message || translations.teamDialog.errors.createFailed);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Add from event pool
      if (!selectedEventTeamId) {
        toast.error('Prosím vyberte tým z event poolu');
        return;
      }

      try {
        setIsSubmitting(true);
        await beerPongService.addTeamFromEvent(beerPongEventId, selectedEventTeamId);
        toast.success(translations.teamDialog.success);
        onSuccess();
        onClose();
      } catch (error: any) {
        console.error('Failed to add team from event:', error);
        toast.error(error.response?.data?.message || 'Nepodařilo se přidat tým z event poolu');
      } finally {
        setIsSubmitting(false);
      }
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

  const getUserDisplayName = (userId: string): string => {
    const user = users.find((u) => u.id === userId);
    if (!user) return userId;
    return user.username || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
  };

  // Filter event teams to exclude those already in the tournament
  const getAvailableEventTeams = () => {
    const existingTeamNames = new Set(
      existingTeams.map((t) => t.name.toLowerCase())
    );
    const existingPlayerPairs = new Set(
      existingTeams.map((t) => `${t.player1Id}-${t.player2Id}`)
    );

    return eventTeams.filter((eventTeam) => {
      const nameLower = eventTeam.name.toLowerCase();
      const playerPair = `${eventTeam.player1Id}-${eventTeam.player2Id}`;
      return (
        !existingTeamNames.has(nameLower) &&
        !existingPlayerPairs.has(playerPair)
      );
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{translations.teamDialog.title}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
              <Button
                variant={activeTab === 0 ? 'contained' : 'outlined'}
                onClick={() => setActiveTab(0)}
                size="small"
                disabled={isSubmitting}
              >
                Vytvořit nový
              </Button>
              <Button
                variant={activeTab === 1 ? 'contained' : 'outlined'}
                onClick={() => setActiveTab(1)}
                size="small"
                disabled={isSubmitting}
              >
                Přidat z event poolu
              </Button>
            </Box>

            {activeTab === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
              label={translations.teamDialog.fields.teamName}
              fullWidth
              required
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
                setNameError('');
              }}
              error={!!nameError}
              helperText={nameError || ''}
              disabled={isSubmitting}
            />

            <FormControl fullWidth required disabled={isSubmitting || loadingUsers}>
              <InputLabel>{translations.teamDialog.fields.player1}</InputLabel>
              <Select
                value={formData.player1Id}
                label={translations.teamDialog.fields.player1}
                onChange={(e) => setFormData((prev) => ({ ...prev, player1Id: e.target.value }))}
              >
                {getAvailableUsers(formData.player2Id).map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.username || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required disabled={isSubmitting || loadingUsers}>
              <InputLabel>{translations.teamDialog.fields.player2}</InputLabel>
              <Select
                value={formData.player2Id}
                label={translations.teamDialog.fields.player2}
                onChange={(e) => setFormData((prev) => ({ ...prev, player2Id: e.target.value }))}
              >
                {getAvailableUsers(formData.player1Id).map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.username || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

                {existingTeams.length >= 8 && (
                  <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                    {translations.detail.teams.full}
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {loadingEventTeams ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    Načítání týmů z event poolu...
                  </Box>
                ) : getAvailableEventTeams().length === 0 ? (
                  <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    V event poolu nejsou žádné dostupné týmy. Vytvořte nejprve tým v event poolu nebo použijte kartu "Vytvořit nový".
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
                          {team.name} ({team.player1?.username || team.player1?.name || [team.player1?.firstName, team.player1?.lastName].filter(Boolean).join(' ').trim() || 'N/A'} & {team.player2?.username || team.player2?.name || [team.player2?.firstName, team.player2?.lastName].filter(Boolean).join(' ').trim() || 'N/A'})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                {existingTeams.length >= 8 && (
                  <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                    {translations.detail.teams.full}
                  </Box>
                )}
              </Box>
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
              existingTeams.length >= 8 ||
              loadingUsers ||
              (activeTab === 1 && (!selectedEventTeamId || loadingEventTeams))
            }
          >
            {activeTab === 0 ? translations.teamDialog.buttons.create : 'Přidat z poolu'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
