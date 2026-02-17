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
import type { BeerPongTeam, EventBeerPongTeam } from '@demonicka/shared-types';
import type { User } from '@demonicka/shared-types';

type Mode = 'create' | 'fromEvent';

interface BeerPongTeamModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  beerPongEventId: string;
  eventId: string;
  existingTeams: BeerPongTeam[];
}

function userName(u: User | undefined): string {
  if (!u) return '?';
  return u.name || u.username || [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || '?';
}

function eventTeamLabel(t: EventBeerPongTeam): string {
  const p1 = t.player1?.name || t.player1?.username || '?';
  const p2 = t.player2?.name || t.player2?.username || '?';
  return t.name?.trim() ? `${t.name} (${p1} & ${p2})` : `${p1} & ${p2}`;
}

export function BeerPongTeamModal({
  visible,
  onClose,
  onSuccess,
  beerPongEventId,
  eventId,
  existingTeams,
}: BeerPongTeamModalProps) {
  const token = useAuthStore((state) => state.token);
  const [mode, setMode] = useState<Mode>('create');
  const [name, setName] = useState('');
  const [player1Id, setPlayer1Id] = useState('');
  const [player2Id, setPlayer2Id] = useState('');
  const [selectedEventTeamId, setSelectedEventTeamId] = useState('');
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
      setName('');
      setPlayer1Id('');
      setPlayer2Id('');
      setSelectedEventTeamId('');
      setMode('create');
      setError('');
      loadUsers();
      loadEventTeams();
    }
  }, [visible, loadUsers, loadEventTeams]);

  const usedUserIds = new Set(
    existingTeams.flatMap((t) => [t.player1Id, t.player2Id])
  );
  const availableUsers = users.filter((u) => !usedUserIds.has(u.id));
  const availableForP1 = player2Id
    ? availableUsers.filter((u) => u.id !== player2Id)
    : availableUsers;
  const availableForP2 = player1Id
    ? availableUsers.filter((u) => u.id !== player1Id)
    : availableUsers;

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
    setError('');
    if (!token) return;

    if (mode === 'create') {
      if (!name.trim()) {
        setError('Zadejte název týmu');
        return;
      }
      if (!player1Id || !player2Id) {
        setError('Vyberte oba hráče');
        return;
      }
      if (player1Id === player2Id) {
        setError('Hráči musí být různí');
        return;
      }
      setIsSubmitting(true);
      try {
        await api.post(
          `/beer-pong/${beerPongEventId}/teams`,
          { name: name.trim(), player1Id, player2Id },
          token
        );
        onSuccess();
        onClose();
      } catch (e) {
        setError((e as { message?: string })?.message ?? 'Nepodařilo se přidat tým');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!selectedEventTeamId) {
        setError('Vyberte tým z event poolu');
        return;
      }
      setIsSubmitting(true);
      try {
        await api.post(
          `/beer-pong/${beerPongEventId}/teams/from-event`,
          { eventBeerPongTeamId: selectedEventTeamId },
          token
        );
        onSuccess();
        onClose();
      } catch (e) {
        setError((e as { message?: string })?.message ?? 'Nepodařilo se přidat tým');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Přidat tým</Text>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, mode === 'create' && styles.tabActive]}
              onPress={() => setMode('create')}
              disabled={isSubmitting}
            >
              <Text style={[styles.tabText, mode === 'create' && styles.tabTextActive]}>
                Vytvořit nový
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'fromEvent' && styles.tabActive]}
              onPress={() => setMode('fromEvent')}
              disabled={isSubmitting}
            >
              <Text style={[styles.tabText, mode === 'fromEvent' && styles.tabTextActive]}>
                Z event poolu
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {mode === 'create' && (
              <>
                <Text style={styles.label}>Název týmu *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Např. Tým A"
                  placeholderTextColor="#9ca3af"
                  editable={!isSubmitting}
                />
                <Text style={styles.label}>Hráč 1 *</Text>
                <View style={styles.pickerWrap}>
                  {loadingUsers ? (
                    <Text style={styles.emptyHint}>Načítání…</Text>
                  ) : availableForP1.length === 0 ? (
                    <Text style={styles.emptyHint}>Žádní volní účastníci</Text>
                  ) : (
                    availableForP1.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.pickerItem,
                          player1Id === item.id && styles.pickerItemActive,
                        ]}
                        onPress={() => setPlayer1Id(item.id)}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            player1Id === item.id && styles.pickerItemTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {userName(item)}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
                <Text style={styles.label}>Hráč 2 *</Text>
                <View style={styles.pickerWrap}>
                  {loadingUsers ? (
                    <Text style={styles.emptyHint}>Načítání…</Text>
                  ) : availableForP2.length === 0 ? (
                    <Text style={styles.emptyHint}>Žádní volní účastníci</Text>
                  ) : (
                    availableForP2.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.pickerItem,
                          player2Id === item.id && styles.pickerItemActive,
                        ]}
                        onPress={() => setPlayer2Id(item.id)}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            player2Id === item.id && styles.pickerItemTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {userName(item)}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </>
            )}

            {mode === 'fromEvent' && (
              <>
                {loadingEventTeams ? (
                  <Text style={styles.emptyHint}>Načítání týmů z event poolu…</Text>
                ) : availableEventTeams.length === 0 ? (
                  <Text style={styles.emptyHint}>
                    V event poolu nejsou žádné dostupné týmy. Vytvořte tým v záložce „Vytvořit nový“.
                  </Text>
                ) : (
                  <>
                    <Text style={styles.label}>Vybrat tým z event poolu</Text>
                    <View style={styles.pickerWrap}>
                      {availableEventTeams.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.pickerItem,
                            selectedEventTeamId === item.id && styles.pickerItemActive,
                          ]}
                          onPress={() => setSelectedEventTeamId(item.id)}
                        >
                          <Text
                            style={[
                              styles.pickerItemText,
                              selectedEventTeamId === item.id && styles.pickerItemTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {eventTeamLabel(item)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.cancelText}>Zrušit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={
                isSubmitting ||
                (mode === 'create' &&
                  (!name.trim() || !player1Id || !player2Id || player1Id === player2Id)) ||
                (mode === 'fromEvent' && !selectedEventTeamId) ||
                (mode === 'fromEvent' && availableEventTeams.length === 0)
              }
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitText}>
                  {mode === 'create' ? 'Vytvořit' : 'Přidat z poolu'}
                </Text>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '85%',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#111', padding: 20, paddingBottom: 8 },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  tabActive: { backgroundColor: '#FF0000' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
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
  pickerWrap: { maxHeight: 140, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, overflow: 'hidden' },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerItemActive: { backgroundColor: 'rgba(255, 0, 0, 0.1)' },
  pickerItemText: { fontSize: 15, color: '#111' },
  pickerItemTextActive: { color: '#FF0000', fontWeight: '600' },
  emptyHint: { fontSize: 14, color: '#6b7280', marginTop: 12 },
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
    minWidth: 120,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
