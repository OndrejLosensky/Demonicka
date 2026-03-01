import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useActiveEvent } from '../../../../hooks/useActiveEvent';
import { useRole } from '../../../../hooks/useRole';
import { useAuthStore } from '../../../../store/auth.store';
import { useEventStore } from '../../../../store/event.store';
import { api } from '../../../../services/api';
import { Header } from '../../../../components/layout/Header';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Icon } from '../../../../components/icons';
import { formatDate, formatDateTimeLong } from '../../../../utils/format';
import type { Event } from '@demonicka/shared-types';

function toLocalDateTimeInput(iso: string): string {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day}T${h}:${min}`;
  } catch {
    return '';
  }
}

function fromLocalDateTimeInput(value: string): string {
  if (!value || value.length < 16) return '';
  return new Date(value).toISOString();
}

export default function EventSettingsScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const { activeEvent, isLoading } = useActiveEvent();
  const refetchActiveEvent = useEventStore((state) => state.fetchActiveEvent);
  const { isOperator } = useRole();

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState<string | null>(null);
  const [editStartDate, setEditStartDate] = useState<string | null>(null);
  const [editEndDate, setEditEndDate] = useState<string | null>(null);
  const [editBeerPrice, setEditBeerPrice] = useState<number | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    setEventsLoading(true);
    try {
      const list = await api.get<Event[]>('/events', token);
      setEvents(list ?? []);
    } catch (e) {
      console.error('Failed to fetch events:', e);
    } finally {
      setEventsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOperator && !activeEvent) {
      fetchEvents();
    }
  }, [isOperator, activeEvent, fetchEvents]);

  const handleActivateEvent = useCallback(
    async (eventId: string) => {
      if (!token) return;
      setSaving(true);
      try {
        await api.put(`/events/${eventId}/active`, {}, token);
        await refetchActiveEvent();
      } catch (e: unknown) {
        const err = e as { message?: string };
        Alert.alert('Chyba', err?.message ?? 'Nepodařilo se aktivovat událost');
      } finally {
        setSaving(false);
      }
    },
    [token, refetchActiveEvent]
  );

  const handleDeactivate = useCallback(async () => {
    if (!activeEvent?.id || !token) return;
    Alert.alert(
      'Deaktivovat událost',
      `Opravdu chcete deaktivovat "${activeEvent.name}"?`,
      [
        { text: 'Zrušit', style: 'cancel' },
        {
          text: 'Deaktivovat',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await api.delete(`/events/${activeEvent.id}/active`, token);
              await refetchActiveEvent();
            } catch (e: unknown) {
              const err = e as { message?: string };
              Alert.alert('Chyba', err?.message ?? 'Nepodařilo se deaktivovat');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }, [activeEvent, token, refetchActiveEvent]);

  const handleUpdateEvent = useCallback(
    async (payload: Partial<Event>) => {
      if (!activeEvent?.id || !token || activeEvent.isActive) return;
      setSaving(true);
      try {
        await api.put(`/events/${activeEvent.id}`, payload, token);
        await refetchActiveEvent();
        setEditName(null);
        setEditStartDate(null);
        setEditEndDate(null);
        setEditBeerPrice(null);
      } catch (e: unknown) {
        const err = e as { message?: string };
        Alert.alert('Chyba', err?.message ?? 'Nepodařilo se uložit');
      } finally {
        setSaving(false);
      }
    },
    [activeEvent, token, refetchActiveEvent]
  );

  const handleOpenRegistration = useCallback(async () => {
    if (!activeEvent?.id || !token) return;
    setSaving(true);
    try {
      await api.put<{ token: string; link: string }>(
        `/events/${activeEvent.id}/registration/open`,
        {},
        token
      );
      await refetchActiveEvent();
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Chyba', err?.message ?? 'Nepodařilo se otevřít registraci');
    } finally {
      setSaving(false);
    }
  }, [activeEvent, token, refetchActiveEvent]);

  const handleCloseRegistration = useCallback(async () => {
    if (!activeEvent?.id || !token) return;
    setSaving(true);
    try {
      await api.put(`/events/${activeEvent.id}/registration/close`, {}, token);
      await refetchActiveEvent();
    } catch (e: unknown) {
      const err = e as { message?: string };
      Alert.alert('Chyba', err?.message ?? 'Nepodařilo se uzavřít registraci');
    } finally {
      setSaving(false);
    }
  }, [activeEvent, token, refetchActiveEvent]);

  if (!isOperator) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Nastavení události" showBack />
        <EmptyState
          icon={<Icon name="lock" size={48} color="#9ca3af" />}
          title="Přístup odepřen"
          message="Nemáte oprávnění k této sekci."
        />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return <LoadingScreen showLogo={false} />;
  }

  // No active event: show list of events to activate
  if (!activeEvent) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Nastavení události" showBack />
        {eventsLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#FF0000" />
          </View>
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionTitle}>Aktivovat událost</Text>
            <Text style={styles.hint}>
              Žádná událost není aktivní. Vyberte událost a aktivujte ji.
            </Text>
            {events.map((ev) => (
              <TouchableOpacity
                key={ev.id}
                style={styles.eventCard}
                onPress={() => handleActivateEvent(ev.id)}
                disabled={saving}
              >
                <View style={styles.eventCardMain}>
                  <Text style={styles.eventCardName}>{ev.name}</Text>
                  <Text style={styles.eventCardDate}>{formatDate(ev.startDate)}</Text>
                </View>
                {saving ? (
                  <ActivityIndicator size="small" color="#FF0000" />
                ) : (
                  <Text style={styles.activateLabel}>Aktivovat</Text>
                )}
              </TouchableOpacity>
            ))}
            {events.length === 0 && !eventsLoading && (
              <EmptyState
                icon={<Icon name="calendar" size={48} color="#9ca3af" />}
                title="Žádné události"
                message="Nemáte přístup k žádné události k aktivaci."
              />
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  const canEdit = !activeEvent.isActive;
  const regEnabled = activeEvent.registrationEnabled ?? false;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Nastavení události" showBack />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Quick action: Leaderboard */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rychlé akce</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => router.push('/leaderboard')}
                activeOpacity={0.8}
              >
                <View style={styles.linkLeft}>
                  <Icon name="chart" size={20} color="#6b7280" />
                  <Text style={styles.linkLabel}>Žebříček (rychlá kontrola)</Text>
                </View>
                <Text style={styles.linkArrow}>→</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Activate / Deactivate */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stav události</Text>
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>Aktivní událost</Text>
                  <Text style={styles.switchDescription}>
                    Událost je právě aktivní a probíhá
                  </Text>
                </View>
                <View style={styles.badgeWrap}>
                  <View style={[styles.badge, activeEvent.isActive && styles.badgeActive]}>
                    <Text style={[styles.badgeText, activeEvent.isActive && styles.badgeTextActive]}>
                      {activeEvent.isActive ? 'Aktivní' : 'Neaktivní'}
                    </Text>
                  </View>
                </View>
              </View>
              {!activeEvent.isActive ? null : (
                <TouchableOpacity
                  style={styles.dangerButton}
                  onPress={handleDeactivate}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.dangerButtonText}>Deaktivovat událost</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Registration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Registrace</Text>
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>Registrace otevřená</Text>
                  <Text style={styles.switchDescription}>
                    Noví účastníci se mohou registrovat
                  </Text>
                </View>
                <View style={styles.badgeWrap}>
                  <View style={[styles.badge, regEnabled && styles.badgeActive]}>
                    <Text style={[styles.badgeText, regEnabled && styles.badgeTextActive]}>
                      {regEnabled ? 'Otevřeno' : 'Zavřeno'}
                    </Text>
                  </View>
                </View>
              </View>
              {regEnabled ? (
                <TouchableOpacity
                  style={styles.outlineButton}
                  onPress={handleCloseRegistration}
                  disabled={saving}
                >
                  <Text style={styles.outlineButtonText}>Uzavřít registraci</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleOpenRegistration}
                  disabled={saving}
                >
                  <Text style={styles.primaryButtonText}>Otevřít registraci</Text>
                </TouchableOpacity>
              )}
              {activeEvent.registrationToken && regEnabled && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Registrační kód</Text>
                  <Text style={styles.fieldValueMono} selectable>
                    {activeEvent.registrationToken}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Basic info - editable when not active */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Základní informace</Text>
            <View style={styles.card}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Název</Text>
                {editName !== null ? (
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    onBlur={() => {
                      const t = editName.trim();
                      if (t && t !== activeEvent.name) handleUpdateEvent({ name: t });
                      setEditName(null);
                    }}
                    autoFocus
                    editable={canEdit}
                  />
                ) : (
                  <TouchableOpacity
                    onPress={() => canEdit && setEditName(activeEvent.name)}
                    disabled={!canEdit}
                  >
                    <Text style={[styles.fieldValue, !canEdit && styles.fieldValueMuted]}>
                      {activeEvent.name}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {activeEvent.description ? (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Popis</Text>
                  <Text style={styles.fieldValue}>{activeEvent.description}</Text>
                </View>
              ) : null}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Začátek</Text>
                {editStartDate !== null ? (
                  <TextInput
                    style={styles.input}
                    value={editStartDate}
                    onChangeText={setEditStartDate}
                    placeholder="YYYY-MM-DDTHH:mm"
                    onBlur={() => {
                      const iso = fromLocalDateTimeInput(editStartDate);
                      if (iso && iso !== activeEvent.startDate)
                        handleUpdateEvent({ startDate: iso });
                      setEditStartDate(null);
                    }}
                    editable={canEdit}
                  />
                ) : (
                  <TouchableOpacity
                    onPress={() => canEdit && setEditStartDate(toLocalDateTimeInput(activeEvent.startDate))}
                    disabled={!canEdit}
                  >
                    <Text style={[styles.fieldValue, !canEdit && styles.fieldValueMuted]}>
                      {formatDateTimeLong(activeEvent.startDate)}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Konec</Text>
                {editEndDate !== null ? (
                  <TextInput
                    style={styles.input}
                    value={editEndDate}
                    onChangeText={setEditEndDate}
                    placeholder="YYYY-MM-DDTHH:mm"
                    onBlur={() => {
                      const iso = fromLocalDateTimeInput(editEndDate);
                      if (iso && iso !== activeEvent.endDate) handleUpdateEvent({ endDate: iso });
                      setEditEndDate(null);
                    }}
                    editable={canEdit}
                  />
                ) : (
                  <TouchableOpacity
                    onPress={() => canEdit && setEditEndDate(toLocalDateTimeInput(activeEvent.endDate))}
                    disabled={!canEdit}
                  >
                    <Text style={[styles.fieldValue, !canEdit && styles.fieldValueMuted]}>
                      {formatDateTimeLong(activeEvent.endDate)}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Event config: beer pong, beer sizes, beer price */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nastavení události</Text>
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>Beer pong</Text>
                  <Text style={styles.switchDescription}>Povolit beer pong pro tuto událost</Text>
                </View>
                <Switch
                  value={activeEvent.beerPongEnabled !== false}
                  onValueChange={(v) => handleUpdateEvent({ beerPongEnabled: v })}
                  disabled={!canEdit || saving}
                  trackColor={{ false: '#e5e7eb', true: '#dcfce7' }}
                  thumbColor={activeEvent.beerPongEnabled !== false ? '#16a34a' : '#9ca3af'}
                />
              </View>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>Malé piva (0,3 l)</Text>
                  <Text style={styles.switchDescription}>
                    Povolit přidávání malých piv pro tuto událost
                  </Text>
                </View>
                <Switch
                  value={activeEvent.beerSizesEnabled !== false}
                  onValueChange={(v) => handleUpdateEvent({ beerSizesEnabled: v })}
                  disabled={!canEdit || saving}
                  trackColor={{ false: '#e5e7eb', true: '#dcfce7' }}
                  thumbColor={activeEvent.beerSizesEnabled !== false ? '#16a34a' : '#9ca3af'}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Cena piva (Kč)</Text>
                {editBeerPrice !== null ? (
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={String(editBeerPrice)}
                    onChangeText={(t) => setEditBeerPrice(parseInt(t, 10) || 0)}
                    onBlur={() => {
                      const num = editBeerPrice ?? activeEvent.beerPrice ?? 30;
                      if (num >= 0 && num !== (activeEvent.beerPrice ?? 30))
                        handleUpdateEvent({ beerPrice: num });
                      setEditBeerPrice(null);
                    }}
                    editable={canEdit}
                  />
                ) : (
                  <TouchableOpacity
                    onPress={() => canEdit && setEditBeerPrice(activeEvent.beerPrice ?? 30)}
                    disabled={!canEdit}
                  >
                    <Text style={[styles.fieldValue, !canEdit && styles.fieldValueMuted]}>
                      {activeEvent.beerPrice ?? 30} ,-
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {!canEdit && (
            <View style={styles.infoNote}>
              <Text style={styles.infoNoteText}>
                Nastavení lze měnit pouze u neaktivní události. Pro úpravy nejdříve událost
                deaktivujte.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { paddingBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  hint: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  card: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 16 },
  field: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  fieldLabel: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  fieldValue: { fontSize: 15, color: '#111', fontWeight: '500' },
  fieldValueMuted: { color: '#9ca3af' },
  fieldValueMono: { fontSize: 15, color: '#111', fontWeight: '500', fontFamily: 'monospace' },
  input: {
    fontSize: 15,
    color: '#111',
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  switchLabel: { fontSize: 15, color: '#111', fontWeight: '500' },
  switchDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    maxWidth: 220,
  },
  badgeWrap: { marginLeft: 8 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  badgeActive: { backgroundColor: '#dcfce7' },
  badgeText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  badgeTextActive: { color: '#16a34a' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkLabel: { fontSize: 15, color: '#111', fontWeight: '500' },
  linkArrow: { fontSize: 16, color: '#9ca3af' },
  primaryButton: {
    backgroundColor: '#FF0000',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  outlineButtonText: { fontSize: 15, fontWeight: '600', color: '#111' },
  dangerButton: {
    backgroundColor: '#dc2626',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  dangerButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  eventCardMain: { flex: 1 },
  eventCardName: { fontSize: 17, fontWeight: '600', color: '#111' },
  eventCardDate: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  activateLabel: { fontSize: 14, fontWeight: '600', color: '#FF0000' },
  infoNote: { paddingTop: 8 },
  infoNoteText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
