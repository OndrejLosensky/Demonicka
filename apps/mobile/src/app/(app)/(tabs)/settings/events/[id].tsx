import { useState, useCallback, useEffect, useMemo } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../../../store/auth.store';
import { useEventStore } from '../../../../../store/event.store';
import { useThemeColors } from '../../../../../hooks/useThemeColors';
import { api } from '../../../../../services/api';
import { parseError, logBackgroundError } from '../../../../../utils/errorHandler';
import { Header } from '../../../../../components/layout/Header';
import { LoadingScreen } from '../../../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../../../components/ui/EmptyState';
import { Icon } from '../../../../../components/icons';
import { formatDateTimeLong } from '../../../../../utils/format';
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

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const token = useAuthStore((state) => state.token);
  const refetchActiveEvent = useEventStore((state) => state.fetchActiveEvent);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState<string | null>(null);
  const [editStartDate, setEditStartDate] = useState<string | null>(null);
  const [editEndDate, setEditEndDate] = useState<string | null>(null);
  const [editBeerPrice, setEditBeerPrice] = useState<number | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!id || !token) return;
    try {
      const data = await api.get<Event>(`/events/${id}`, token);
      setEvent(data);
    } catch (e) {
      logBackgroundError(e, 'FetchEvent');
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleActivate = useCallback(async () => {
    if (!id || !token) return;
    setSaving(true);
    try {
      await api.put(`/events/${id}/active`, {}, token);
      await Promise.all([refetchActiveEvent(), fetchEvent()]);
    } catch (e: unknown) {
      if (parseError(e).isNetworkError || parseError(e).isOfflineQueued) {
        logBackgroundError(e, 'EventActivate');
      } else {
        const err = e as { message?: string };
        Alert.alert('Chyba', err?.message ?? 'Nepodařilo se aktivovat');
      }
    } finally {
      setSaving(false);
    }
  }, [id, token, refetchActiveEvent, fetchEvent]);

  const handleDeactivate = useCallback(async () => {
    if (!event?.id || !token) return;
    Alert.alert(
      'Deaktivovat událost',
      `Opravdu chcete deaktivovat "${event.name}"?`,
      [
        { text: 'Zrušit', style: 'cancel' },
        {
          text: 'Deaktivovat',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await api.delete(`/events/${event.id}/active`, token);
              await Promise.all([refetchActiveEvent(), fetchEvent()]);
            } catch (e: unknown) {
              if (parseError(e).isNetworkError || parseError(e).isOfflineQueued) {
                logBackgroundError(e, 'EventDeactivate');
              } else {
                const err = e as { message?: string };
                Alert.alert('Chyba', err?.message ?? 'Nepodařilo se deaktivovat');
              }
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }, [event, token, refetchActiveEvent, fetchEvent]);

  const handleUpdateEvent = useCallback(
    async (payload: Partial<Event>) => {
      if (!event?.id || !token || event.isActive) return;
      setSaving(true);
      try {
        await api.put(`/events/${event.id}`, payload, token);
        await fetchEvent();
        setEditName(null);
        setEditStartDate(null);
        setEditEndDate(null);
        setEditBeerPrice(null);
      } catch (e: unknown) {
        if (parseError(e).isNetworkError || parseError(e).isOfflineQueued) {
          logBackgroundError(e, 'EventSave');
        } else {
          const err = e as { message?: string };
          Alert.alert('Chyba', err?.message ?? 'Nepodařilo se uložit');
        }
      } finally {
        setSaving(false);
      }
    },
    [event, token, fetchEvent]
  );

  const handleOpenRegistration = useCallback(async () => {
    if (!event?.id || !token) return;
    setSaving(true);
    try {
      await api.put(`/events/${event.id}/registration/open`, {}, token);
      await fetchEvent();
    } catch (e: unknown) {
      if (parseError(e).isNetworkError || parseError(e).isOfflineQueued) {
        logBackgroundError(e, 'EventRegistrationOpen');
      } else {
        const err = e as { message?: string };
        Alert.alert('Chyba', err?.message ?? 'Nepodařilo se otevřít registraci');
      }
    } finally {
      setSaving(false);
    }
  }, [event, token, fetchEvent]);

  const handleCloseRegistration = useCallback(async () => {
    if (!event?.id || !token) return;
    setSaving(true);
    try {
      await api.put(`/events/${event.id}/registration/close`, {}, token);
      await fetchEvent();
    } catch (e: unknown) {
      if (parseError(e).isNetworkError || parseError(e).isOfflineQueued) {
        logBackgroundError(e, 'EventRegistrationClose');
      } else {
        const err = e as { message?: string };
        Alert.alert('Chyba', err?.message ?? 'Nepodařilo se uzavřít registraci');
      }
    } finally {
      setSaving(false);
    }
  }, [event, token, fetchEvent]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        flex: { flex: 1 },
        scroll: { flex: 1 },
        scrollContent: { paddingHorizontal: 12, paddingBottom: 24 },
        section: { marginBottom: 12 },
        sectionTitle: {
          fontSize: 12,
          fontWeight: '600',
          color: colors.textSecondary,
          textTransform: 'uppercase',
          marginBottom: 6,
          marginLeft: 2,
        },
        card: {
          backgroundColor: colors.card,
          borderRadius: 10,
          padding: 12,
          borderWidth: 1,
          borderColor: colors.cardBorder,
        },
        field: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
        fieldLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
        fieldValue: { fontSize: 15, color: colors.text, fontWeight: '500' },
        fieldMono: { fontSize: 14, fontFamily: 'monospace', color: colors.text },
        fieldMuted: { color: colors.textMuted },
        input: {
          fontSize: 15,
          color: colors.text,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          paddingHorizontal: 10,
          paddingVertical: 6,
          backgroundColor: colors.inputBg,
        },
        switchRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        switchLabel: { fontSize: 15, color: colors.text, fontWeight: '500' },
        switchDescription: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
        badge: {
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          backgroundColor: colors.border,
        },
        badgeActive: { backgroundColor: colors.greenBg },
        badgeText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
        badgeTextActive: { color: colors.green },
        linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        linkLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        linkLabel: { fontSize: 15, color: colors.text, fontWeight: '500' },
        linkArrow: { fontSize: 14, color: colors.textMuted },
        primaryBtn: {
          backgroundColor: colors.primary,
          borderRadius: 8,
          paddingVertical: 10,
          alignItems: 'center',
          marginTop: 8,
        },
        primaryBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
        outlineBtn: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          paddingVertical: 10,
          alignItems: 'center',
          marginTop: 8,
        },
        outlineBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },
        dangerBtn: {
          backgroundColor: colors.red,
          borderRadius: 8,
          paddingVertical: 10,
          alignItems: 'center',
          marginTop: 8,
        },
        dangerBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
        note: { paddingTop: 8, paddingHorizontal: 4 },
        noteText: { fontSize: 12, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic' },
      }),
    [colors]
  );

  if (loading) return <LoadingScreen showLogo={false} />;
  if (!id || !event) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Událost" showBack />
        <EmptyState
          icon={<Icon name="calendar" size={48} color={colors.textMuted} />}
          title="Událost nenalezena"
          message="Událost neexistuje nebo k ní nemáte přístup."
        />
      </SafeAreaView>
    );
  }

  const canEdit = !event.isActive;
  const regEnabled = event.registrationEnabled ?? false;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title={event.name} showBack />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rychlé akce</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/leaderboard')} activeOpacity={0.8}>
                <View style={styles.linkLeft}>
                  <Icon name="chart" size={20} color={colors.textSecondary} />
                  <Text style={styles.linkLabel}>Žebříček</Text>
                </View>
                <Text style={styles.linkArrow}>→</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stav</Text>
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>Aktivní</Text>
                  <Text style={styles.switchDescription}>{event.isActive ? 'Událost probíhá' : 'Událost není aktivní'}</Text>
                </View>
                <View style={[styles.badge, event.isActive && styles.badgeActive]}>
                  <Text style={[styles.badgeText, event.isActive && styles.badgeTextActive]}>
                    {event.isActive ? 'Aktivní' : 'Neaktivní'}
                  </Text>
                </View>
              </View>
              {event.isActive ? (
                <TouchableOpacity style={styles.dangerBtn} onPress={handleDeactivate} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.dangerBtnText}>Deaktivovat</Text>}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.primaryBtn} onPress={handleActivate} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryBtnText}>Aktivovat událost</Text>}
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Registrace</Text>
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>Otevřená registrace</Text>
                </View>
                <View style={[styles.badge, regEnabled && styles.badgeActive]}>
                  <Text style={[styles.badgeText, regEnabled && styles.badgeTextActive]}>{regEnabled ? 'Ano' : 'Ne'}</Text>
                </View>
              </View>
              {regEnabled ? (
                <TouchableOpacity style={styles.outlineBtn} onPress={handleCloseRegistration} disabled={saving}>
                  <Text style={styles.outlineBtnText}>Uzavřít</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.primaryBtn} onPress={handleOpenRegistration} disabled={saving}>
                  <Text style={styles.primaryBtnText}>Otevřít registraci</Text>
                </TouchableOpacity>
              )}
              {event.registrationToken && regEnabled && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Kód</Text>
                  <Text style={styles.fieldMono} selectable>{event.registrationToken}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Základní údaje</Text>
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
                      if (t && t !== event.name) handleUpdateEvent({ name: t });
                      setEditName(null);
                    }}
                    autoFocus
                    editable={canEdit}
                  />
                ) : (
                  <TouchableOpacity onPress={() => canEdit && setEditName(event.name)} disabled={!canEdit}>
                    <Text style={[styles.fieldValue, !canEdit && styles.fieldMuted]}>{event.name}</Text>
                  </TouchableOpacity>
                )}
              </View>
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
                      if (iso && iso !== event.startDate) handleUpdateEvent({ startDate: iso });
                      setEditStartDate(null);
                    }}
                    editable={canEdit}
                  />
                ) : (
                  <TouchableOpacity onPress={() => canEdit && setEditStartDate(toLocalDateTimeInput(event.startDate))} disabled={!canEdit}>
                    <Text style={[styles.fieldValue, !canEdit && styles.fieldMuted]}>{formatDateTimeLong(event.startDate)}</Text>
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
                      if (iso && iso !== event.endDate) handleUpdateEvent({ endDate: iso });
                      setEditEndDate(null);
                    }}
                    editable={canEdit}
                  />
                ) : (
                  <TouchableOpacity onPress={() => canEdit && setEditEndDate(toLocalDateTimeInput(event.endDate))} disabled={!canEdit}>
                    <Text style={[styles.fieldValue, !canEdit && styles.fieldMuted]}>{formatDateTimeLong(event.endDate)}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nastavení</Text>
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>Beer pong</Text>
                </View>
                <Switch
                  value={event.beerPongEnabled !== false}
                  onValueChange={(v) => handleUpdateEvent({ beerPongEnabled: v })}
                  disabled={!canEdit || saving}
                  trackColor={{ false: colors.border, true: colors.greenBg }}
                  thumbColor={event.beerPongEnabled !== false ? colors.green : colors.textMuted}
                />
              </View>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>Malé piva</Text>
                </View>
                <Switch
                  value={event.beerSizesEnabled !== false}
                  onValueChange={(v) => handleUpdateEvent({ beerSizesEnabled: v })}
                  disabled={!canEdit || saving}
                  trackColor={{ false: colors.border, true: colors.greenBg }}
                  thumbColor={event.beerSizesEnabled !== false ? colors.green : colors.textMuted}
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
                      const num = editBeerPrice ?? event.beerPrice ?? 30;
                      if (num >= 0 && num !== (event.beerPrice ?? 30)) handleUpdateEvent({ beerPrice: num });
                      setEditBeerPrice(null);
                    }}
                    editable={canEdit}
                  />
                ) : (
                  <TouchableOpacity onPress={() => canEdit && setEditBeerPrice(event.beerPrice ?? 30)} disabled={!canEdit}>
                    <Text style={[styles.fieldValue, !canEdit && styles.fieldMuted]}>{event.beerPrice ?? 30} ,-</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {!canEdit && (
            <View style={styles.note}>
              <Text style={styles.noteText}>Úpravy jsou možné jen u neaktivní události. Nejdříve ji deaktivujte.</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
