import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { api } from '../../services/api';
import type {
  BeerPongGame,
  BeerPongTeam,
  EventBeerPongTeam,
} from '@demonicka/shared-types';
import type { User } from '@demonicka/shared-types';

type Mode = 'select' | 'create' | 'fromEvent';

interface BeerPongAssignTeamModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  game: BeerPongGame | null;
  position: 'team1' | 'team2' | null;
  existingTeams: BeerPongTeam[];
  beerPongEventId: string;
  eventId: string;
}

function teamDisplayName(t: BeerPongTeam | EventBeerPongTeam): string {
  if (t.name?.trim()) return t.name;
  const p1 = 'player1' in t && t.player1 ? (t.player1 as { name?: string; username?: string }).name || (t.player1 as { name?: string; username?: string }).username : '?';
  const p2 = 'player2' in t && t.player2 ? (t.player2 as { name?: string; username?: string }).name || (t.player2 as { name?: string; username?: string }).username : '?';
  return `${p1} & ${p2}`;
}

function userName(u: User | undefined): string {
  if (!u) return '?';
  return u.name || u.username || [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || '?';
}

export function BeerPongAssignTeamModal({
  visible,
  onClose,
  onSuccess,
  game,
  position,
  existingTeams,
  beerPongEventId,
  eventId,
}: BeerPongAssignTeamModalProps) {
  const token = useAuthStore((state) => state.token);
  const [mode, setMode] = useState<Mode>('select');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedEventTeamId, setSelectedEventTeamId] = useState('');
  const [name, setName] = useState('');
  const [player1Id, setPlayer1Id] = useState('');
  const [player2Id, setPlayer2Id] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [eventTeams, setEventTeams] = useState<EventBeerPongTeam[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingEventTeams, setLoadingEventTeams] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadUsers = useCallback(async () => {
    if (!token || !eventId) return;
    setLoadingUsers(true);
    try {
      const data = await api.get<User[]>(`/events/${eventId}/users`, token);
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [token, eventId]);

  const loadEventTeams = useCallback(async () => {
    if (!token || !eventId) return;
    setLoadingEventTeams(true);
    try {
      const data = await api.get<EventBeerPongTeam[]>(
        `/events/${eventId}/beer-pong-teams`,
        token
      );
      setEventTeams(Array.isArray(data) ? data : []);
    } catch {
      setEventTeams([]);
    } finally {
      setLoadingEventTeams(false);
    }
  }, [token, eventId]);

  useEffect(() => {
    if (visible) {
      setMode('select');
      setSelectedTeamId('');
      setSelectedEventTeamId('');
      setName('');
      setPlayer1Id('');
      setPlayer2Id('');
      setError('');
      loadUsers();
      loadEventTeams();
    }
  }, [visible, loadUsers, loadEventTeams]);

  const usedUserIds = new Set(
    existingTeams.flatMap((t) => [t.player1Id, t.player2Id])
  );
  const availableUsers = users.filter((u) => !usedUserIds.has(u.id));
  const availableForP1 = player2Id ? availableUsers.filter((u) => u.id !== player2Id) : availableUsers;
  const availableForP2 = player1Id ? availableUsers.filter((u) => u.id !== player1Id) : availableUsers;

  const existingNames = new Set(existingTeams.map((t) => t.name.toLowerCase()));
  const existingPairs = new Set(
    existingTeams.map((t) => `${t.player1Id}-${t.player2Id}`)
  );
  const availableEventTeams = eventTeams.filter((et) => {
    const nameOk = !et.name?.trim() || !existingNames.has(et.name.toLowerCase());
    const pair = `${et.player1Id}-${et.player2Id}`;
    return nameOk && !existingPairs.has(pair);
  });

  const handleSubmit = async () => {
    if (!token || !game || !position) return;
    setError('');

    const assign = async (teamId: string) => {
      await api.put(
        `/beer-pong/games/${game.id}/assign-team`,
        { teamId, position },
        token
      );
    };

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        if (!name.trim() || !player1Id || !player2Id || player1Id === player2Id) {
          setError('Vyplňte název a oba hráče');
          setIsSubmitting(false);
          return;
        }
        const newTeam = await api.post<BeerPongTeam>(
          `/beer-pong/${beerPongEventId}/teams`,
          { name: name.trim(), player1Id, player2Id },
          token
        );
        await assign(newTeam.id);
      } else if (mode === 'fromEvent') {
        if (!selectedEventTeamId) {
          setError('Vyberte tým z event poolu');
          setIsSubmitting(false);
          return;
        }
        const newTeam = await api.post<BeerPongTeam>(
          `/beer-pong/${beerPongEventId}/teams/from-event`,
          { eventBeerPongTeamId: selectedEventTeamId },
          token
        );
        await assign(newTeam.id);
      } else {
        if (!selectedTeamId) {
          setError('Vyberte tým');
          setIsSubmitting(false);
          return;
        }
        await assign(selectedTeamId);
      }
      onSuccess();
      onClose();
    } catch (e) {
      setError((e as { message?: string })?.message ?? 'Nepodařilo se přiřadit tým');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!game || !position) return null;

  const canSubmit =
    mode === 'select' && selectedTeamId ||
    (mode === 'fromEvent' && selectedEventTeamId) ||
    (mode === 'create' && name.trim() && player1Id && player2Id && player1Id !== player2Id);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>
            Přiřadit tým ({position === 'team1' ? 'Tým 1' : 'Tým 2'})
          </Text>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, mode === 'select' && styles.tabActive]}
              onPress={() => setMode('select')}
              disabled={isSubmitting}
            >
              <Text style={[styles.tabText, mode === 'select' && styles.tabTextActive]}>
                Vybrat
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'create' && styles.tabActive]}
              onPress={() => setMode('create')}
              disabled={isSubmitting}
            >
              <Text style={[styles.tabText, mode === 'create' && styles.tabTextActive]}>
                Nový
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'fromEvent' && styles.tabActive]}
              onPress={() => setMode('fromEvent')}
              disabled={isSubmitting}
            >
              <Text style={[styles.tabText, mode === 'fromEvent' && styles.tabTextActive]}>
                Z poolu
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {mode === 'select' && (
              <View style={styles.pickerWrap}>
                {existingTeams.length === 0 ? (
                  <Text style={styles.emptyHint}>Žádné týmy. Vytvořte tým v záložce Týmy.</Text>
                ) : (
                  existingTeams.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.pickerItem,
                        selectedTeamId === t.id && styles.pickerItemActive,
                      ]}
                      onPress={() => setSelectedTeamId(t.id)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedTeamId === t.id && styles.pickerItemTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {teamDisplayName(t)}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {mode === 'create' && (
              <>
                <Text style={styles.label}>Název týmu *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Název"
                  placeholderTextColor="#9ca3af"
                  editable={!isSubmitting}
                />
                <Text style={styles.label}>Hráč 1 *</Text>
                <View style={styles.pickerWrap}>
                  {availableForP1.map((u) => (
                    <TouchableOpacity
                      key={u.id}
                      style={[styles.pickerItem, player1Id === u.id && styles.pickerItemActive]}
                      onPress={() => setPlayer1Id(u.id)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          player1Id === u.id && styles.pickerItemTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {userName(u)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.label}>Hráč 2 *</Text>
                <View style={styles.pickerWrap}>
                  {availableForP2.map((u) => (
                    <TouchableOpacity
                      key={u.id}
                      style={[styles.pickerItem, player2Id === u.id && styles.pickerItemActive]}
                      onPress={() => setPlayer2Id(u.id)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          player2Id === u.id && styles.pickerItemTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {userName(u)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {mode === 'fromEvent' && (
              <View style={styles.pickerWrap}>
                {loadingEventTeams ? (
                  <Text style={styles.emptyHint}>Načítání…</Text>
                ) : availableEventTeams.length === 0 ? (
                  <Text style={styles.emptyHint}>Žádné týmy v event poolu.</Text>
                ) : (
                  availableEventTeams.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.pickerItem,
                        selectedEventTeamId === t.id && styles.pickerItemActive,
                      ]}
                      onPress={() => setSelectedEventTeamId(t.id)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedEventTeamId === t.id && styles.pickerItemTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {teamDisplayName(t as BeerPongTeam)}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.cancelText}>Zrušit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, (isSubmitting || !canSubmit) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting || !canSubmit}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitText}>Přiřadit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  card: { backgroundColor: '#fff', borderRadius: 16, maxHeight: '85%' },
  title: { fontSize: 20, fontWeight: '700', color: '#111', padding: 20, paddingBottom: 8 },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  tab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#f3f4f6' },
  tabActive: { backgroundColor: '#FF0000' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  tabTextActive: { color: '#fff' },
  scroll: { maxHeight: 320 },
  scrollContent: { padding: 20, paddingBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
  },
  pickerWrap: { maxHeight: 160, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, overflow: 'hidden' },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerItemActive: { backgroundColor: 'rgba(255, 0, 0, 0.1)' },
  pickerItemText: { fontSize: 15, color: '#111' },
  pickerItemTextActive: { color: '#FF0000', fontWeight: '600' },
  emptyHint: { fontSize: 14, color: '#6b7280', padding: 12 },
  errorText: { fontSize: 13, color: '#ef4444', marginTop: 12 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelText: { fontSize: 16, color: '#6b7280', fontWeight: '500' },
  submitBtn: {
    backgroundColor: '#FF0000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
