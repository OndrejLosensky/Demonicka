import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useActiveEvent } from '../../../../hooks/useActiveEvent';
import { useAuthStore } from '../../../../store/auth.store';
import { useThemeColors } from '../../../../hooks/useThemeColors';
import { api } from '../../../../services/api';
import { logBackgroundError, parseError } from '../../../../utils/errorHandler';
import { Header } from '../../../../components/layout/Header';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Icon } from '../../../../components/icons';

type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface EventRegistration {
  id: string;
  rawName: string;
  participating: boolean;
  arrivalTime?: string;
  leaveTime?: string;
  status: RegistrationStatus;
  createdAt: string;
  matchedUser?: { id: string; name?: string; username?: string } | null;
  suggestedMatch?: { id: string; name?: string; username?: string } | null;
  suggestedConfidence?: number;
}

function statusLabel(status: RegistrationStatus) {
  switch (status) {
    case 'APPROVED': return 'Schváleno';
    case 'REJECTED': return 'Zamítnuto';
    default: return 'Čeká';
  }
}

function statusColor(status: RegistrationStatus, colors: ReturnType<typeof useThemeColors>) {
  switch (status) {
    case 'APPROVED': return colors.green;
    case 'REJECTED': return colors.red;
    default: return colors.amber;
  }
}

function statusBg(status: RegistrationStatus, colors: ReturnType<typeof useThemeColors>) {
  switch (status) {
    case 'APPROVED': return colors.greenBg;
    case 'REJECTED': return colors.redBg;
    default: return colors.amberBg;
  }
}

export default function EventRegistrationsScreen() {
  const colors = useThemeColors();
  const token = useAuthStore((state) => state.token);
  const { activeEvent } = useActiveEvent();
  const { eventId: paramEventId } = useLocalSearchParams<{ eventId?: string }>();
  const effectiveEventId = paramEventId ?? activeEvent?.id;

  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRegistrations = useCallback(async () => {
    if (!effectiveEventId || !token) return;
    try {
      const data = await api.get<EventRegistration[]>(
        `/events/${effectiveEventId}/registration/review`,
        token,
      );
      setRegistrations(Array.isArray(data) ? data : []);
    } catch (e) {
      logBackgroundError(e, 'FetchRegistrations');
    }
  }, [effectiveEventId, token]);

  useEffect(() => {
    setIsLoading(true);
    fetchRegistrations().finally(() => setIsLoading(false));
  }, [fetchRegistrations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRegistrations();
    setRefreshing(false);
  }, [fetchRegistrations]);

  const handleSetStatus = useCallback(
    async (reg: EventRegistration, status: RegistrationStatus) => {
      if (!effectiveEventId || !token) return;
      setUpdatingId(reg.id);
      try {
        const body: { status: RegistrationStatus; matchedUserId?: string } = { status };
        // When approving, auto-confirm the suggested match if no match is set yet
        if (status === 'APPROVED' && !reg.matchedUser && reg.suggestedMatch) {
          body.matchedUserId = reg.suggestedMatch.id;
        }
        await api.patch(
          `/events/${effectiveEventId}/registration/${reg.id}`,
          body,
          token,
        );
        setRegistrations((prev) =>
          prev.map((r) =>
            r.id === reg.id
              ? { ...r, status, matchedUser: body.matchedUserId ? reg.suggestedMatch : r.matchedUser }
              : r,
          ),
        );
      } catch (e: unknown) {
        if (!parseError(e).isNetworkError) {
          const err = e as { message?: string };
          Alert.alert('Chyba', err?.message ?? 'Nepodařilo se změnit stav');
        }
      } finally {
        setUpdatingId(null);
      }
    },
    [effectiveEventId, token],
  );

  const handleApply = useCallback(async () => {
    if (!effectiveEventId || !token) return;
    // Only count approved registrations that have a matched user (those the backend can actually add)
    const appliableCount = registrations.filter(
      (r) => r.status === 'APPROVED' && r.matchedUser,
    ).length;
    const approvedCount = registrations.filter((r) => r.status === 'APPROVED').length;
    if (approvedCount === 0) {
      Alert.alert('Žádné schválené registrace', 'Nejprve schvalte alespoň jednu registraci.');
      return;
    }
    const unmatchedCount = approvedCount - appliableCount;
    const message = unmatchedCount > 0
      ? `Přidat ${appliableCount} spárovaných účastníků do události? (${unmatchedCount} bez spárování bude přeskočeno)`
      : `Přidat ${appliableCount} schválených účastníků do události?`;
    Alert.alert(
      'Přidat do události',
      message,
      [
        { text: 'Zrušit', style: 'cancel' },
        {
          text: 'Přidat',
          onPress: async () => {
            setApplying(true);
            try {
              const result = await api.post<{ applied: number }>(
                `/events/${effectiveEventId}/registration/apply`,
                {},
                token,
              );
              Alert.alert('Hotovo', `Přidáno ${result.applied} účastníků.`);
              await fetchRegistrations();
            } catch (e: unknown) {
              if (!parseError(e).isNetworkError) {
                const err = e as { message?: string };
                Alert.alert('Chyba', err?.message ?? 'Nepodařilo se přidat účastníky');
              }
            } finally {
              setApplying(false);
            }
          },
        },
      ],
    );
  }, [effectiveEventId, token, registrations, fetchRegistrations]);

  if (isLoading) return <LoadingScreen showLogo={false} />;

  const pendingCount = registrations.filter((r) => r.status === 'PENDING').length;
  const approvedCount = registrations.filter((r) => r.status === 'APPROVED').length;
  const appliableCount = registrations.filter((r) => r.status === 'APPROVED' && r.matchedUser).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <Header title="Registrace" showBack />

      {registrations.length === 0 ? (
        <EmptyState
          icon={<Icon name="inbox" size={48} color={colors.textMuted} />}
          title="Žádné registrace"
          message="Zatím se nikdo nezaregistroval."
        />
      ) : (
        <>
          <View style={[styles.summary, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: colors.amber }]}>{pendingCount}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Čeká</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: colors.green }]}>{approvedCount}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Schváleno</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: colors.red }]}>
                {registrations.filter((r) => r.status === 'REJECTED').length}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Zamítnuto</Text>
            </View>
          </View>

          <FlatList
            data={registrations}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isUpdating = updatingId === item.id;
              const matchLabel =
                item.matchedUser?.name ||
                item.matchedUser?.username ||
                item.suggestedMatch?.name ||
                item.suggestedMatch?.username;
              return (
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardLeft}>
                      <Text style={[styles.cardName, { color: colors.text }]}>{item.rawName}</Text>
                      {matchLabel ? (
                        <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                          Shoda: {matchLabel}
                          {item.suggestedConfidence ? ` (${Math.round(item.suggestedConfidence * 100)}%)` : ''}
                        </Text>
                      ) : null}
                      {item.arrivalTime ? (
                        <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                          Příjezd: {item.arrivalTime}
                        </Text>
                      ) : null}
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusBg(item.status, colors) },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: statusColor(item.status, colors) }]}>
                        {statusLabel(item.status)}
                      </Text>
                    </View>
                  </View>

                  {isUpdating ? (
                    <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
                  ) : (
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          {
                            backgroundColor:
                              item.status === 'APPROVED' ? colors.green : colors.card,
                            borderColor:
                              item.status === 'APPROVED' ? colors.green : colors.border,
                          },
                        ]}
                        onPress={() => handleSetStatus(item, 'APPROVED')}
                        disabled={item.status === 'APPROVED'}
                      >
                        <Icon
                          name="check"
                          size={16}
                          color={item.status === 'APPROVED' ? '#fff' : colors.green}
                        />
                        <Text
                          style={[
                            styles.actionText,
                            {
                              color:
                                item.status === 'APPROVED' ? '#fff' : colors.green,
                            },
                          ]}
                        >
                          Schválit
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          {
                            backgroundColor:
                              item.status === 'REJECTED' ? colors.red : colors.card,
                            borderColor:
                              item.status === 'REJECTED' ? colors.red : colors.border,
                          },
                        ]}
                        onPress={() => handleSetStatus(item, 'REJECTED')}
                        disabled={item.status === 'REJECTED'}
                      >
                        <Icon
                          name="close"
                          size={16}
                          color={item.status === 'REJECTED' ? '#fff' : colors.red}
                        />
                        <Text
                          style={[
                            styles.actionText,
                            {
                              color:
                                item.status === 'REJECTED' ? '#fff' : colors.red,
                            },
                          ]}
                        >
                          Zamítnout
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            }}
          />

          <View style={[styles.footer, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.applyBtn,
                { backgroundColor: appliableCount > 0 ? colors.primary : colors.border },
              ]}
              onPress={handleApply}
              disabled={applying || approvedCount === 0}
            >
              {applying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.applyBtnText}>
                  {appliableCount > 0
                    ? `Přidat schválené (${appliableCount})`
                    : approvedCount > 0
                    ? 'Schválené nemají spárování'
                    : 'Přidat schválené'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summary: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNum: { fontSize: 22, fontWeight: '700' },
  summaryLabel: { fontSize: 12, marginTop: 2 },
  listContent: { padding: 16, paddingBottom: 8 },
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardLeft: { flex: 1, marginRight: 8 },
  cardName: { fontSize: 16, fontWeight: '600' },
  cardSub: { fontSize: 13, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionText: { fontSize: 14, fontWeight: '600' },
  spinner: { marginVertical: 8 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  applyBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
