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
import { useTranslations } from '../../contexts/LocaleContext';

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
  const t = useTranslations<Record<string, unknown>>('beerPong');
  const teamDialog = (t.teamDialog as Record<string, unknown>) || {};
  const teamDialogFields = (teamDialog.fields as Record<string, string>) || {};
  const teamDialogButtons = (teamDialog.buttons as Record<string, string>) || {};
  const teamDialogErrors = (teamDialog.errors as Record<string, string>) || {};
  const detail = (t.detail as Record<string, unknown>) || {};
  const detailTeams = (detail.teams as Record<string, string>) || {};
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
      toast.error(teamDialogErrors.loadUsersFailed ?? 'Nepodařilo se načíst uživatele');
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
      setNameError(teamDialogErrors.nameRequired ?? 'Název týmu je povinný');
      valid = false;
    } else {
      const nameExists = existingTeams.some(
        (team) => team.name.toLowerCase() === formData.name.trim().toLowerCase(),
      );
      if (nameExists) {
        setNameError(teamDialogErrors.nameExists ?? 'Tým s tímto názvem již existuje');
        valid = false;
      } else {
        setNameError('');
      }
    }

    if (!formData.player1Id) {
      toast.error(teamDialogErrors.selectPlayer1 ?? 'Vyberte hráče 1');
      valid = false;
    }

    if (!formData.player2Id) {
      toast.error(teamDialogErrors.selectPlayer2 ?? 'Vyberte hráče 2');
      valid = false;
    }

    if (formData.player1Id === formData.player2Id) {
      toast.error(teamDialogErrors.playersDifferent ?? 'Hráči musí být různí');
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
        toast.success((teamDialog.success as string) ?? 'Tým byl vytvořen');
        onSuccess();
        onClose();
      } catch (error: any) {
        console.error('Failed to create team:', error);
        toast.error(error.response?.data?.message || (teamDialogErrors.createFailed ?? 'Nepodařilo se vytvořit tým'));
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!selectedEventTeamId) {
        toast.error(teamDialogErrors.selectEventTeam ?? 'Prosím vyberte tým z event poolu');
        return;
      }

      try {
        setIsSubmitting(true);
        await beerPongService.addTeamFromEvent(beerPongEventId, selectedEventTeamId);
        toast.success((teamDialog.success as string) ?? 'Tým byl přidán');
        onSuccess();
        onClose();
      } catch (error: any) {
        console.error('Failed to add team from event:', error);
        toast.error(error.response?.data?.message || (teamDialogErrors.addFromEventFailed ?? 'Nepodařilo se přidat tým z event poolu'));
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
        <DialogTitle>{(teamDialog.title as string) ?? 'Přidat Tým'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
              <Button
                variant={activeTab === 0 ? 'contained' : 'outlined'}
                onClick={() => setActiveTab(0)}
                size="small"
                disabled={isSubmitting}
              >
                {(teamDialog.tabCreateNew as string) ?? 'Vytvořit nový'}
              </Button>
              <Button
                variant={activeTab === 1 ? 'contained' : 'outlined'}
                onClick={() => setActiveTab(1)}
                size="small"
                disabled={isSubmitting}
              >
                {(teamDialog.tabAddFromEvent as string) ?? 'Přidat z event poolu'}
              </Button>
            </Box>

            {activeTab === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
              label={teamDialogFields.teamName ?? 'Název týmu'}
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
              <InputLabel>{teamDialogFields.player1 ?? 'Hráč 1'}</InputLabel>
              <Select
                value={formData.player1Id}
                label={teamDialogFields.player1 ?? 'Hráč 1'}
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
              <InputLabel>{teamDialogFields.player2 ?? 'Hráč 2'}</InputLabel>
              <Select
                value={formData.player2Id}
                label={teamDialogFields.player2 ?? 'Hráč 2'}
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
                    {detailTeams.full ?? 'Turnaj je plný (8 týmů). Před přidáním nového týmu odstraňte existující tým.'}
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {loadingEventTeams ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    {(teamDialog.loadingEventTeams as string) ?? 'Načítání týmů z event poolu...'}
                  </Box>
                ) : getAvailableEventTeams().length === 0 ? (
                  <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    {(teamDialog.noEventTeams as string) ?? 'V event poolu nejsou žádné dostupné týmy. Vytvořte nejprve tým v event poolu nebo použijte kartu "Vytvořit nový".'}
                  </Box>
                ) : (
                  <FormControl fullWidth required disabled={isSubmitting}>
                    <InputLabel>{(teamDialog.selectEventTeam as string) ?? 'Vybrat tým z event poolu'}</InputLabel>
                    <Select
                      value={selectedEventTeamId}
                      label={(teamDialog.selectEventTeam as string) ?? 'Vybrat tým z event poolu'}
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
                    {detailTeams.full ?? 'Turnaj je plný (8 týmů).'}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            {teamDialogButtons.cancel ?? 'Zrušit'}
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
            {activeTab === 0 ? (teamDialogButtons.create ?? 'Vytvořit') : (teamDialogButtons.addFromPool ?? 'Přidat z poolu')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
