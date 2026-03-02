import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../../store/auth.store';
import { useActiveEvent } from '../../../../hooks/useActiveEvent';
import { useThemeColors } from '../../../../hooks/useThemeColors';
import { api } from '../../../../services/api';
import { parseError, logBackgroundError } from '../../../../utils/errorHandler';
import { Header } from '../../../../components/layout/Header';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { ErrorView } from '../../../../components/ui/ErrorView';
import { StatCard } from '../../../../components/cards/StatCard';
import { Icon } from '../../../../components/icons';
import { formatRelativeTime, formatDateTimeLong, formatLitres } from '../../../../utils/format';
import type { User } from '@demonicka/shared-types';

type EventUser = User & { eventBeerCount?: number; lastBeerTime?: string };

type BeerEntry = {
  id: string;
  consumedAt: string;
  spilled?: boolean;
  deletedAt?: string | null;
  beerSize?: 'SMALL' | 'LARGE';
  volumeLitres?: number | string;
};

export default function ParticipantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const token = useAuthStore((state) => state.token);
  const { activeEvent } = useActiveEvent();

  const [participant, setParticipant] = useState<EventUser | null>(null);
  const [removing, setRemoving] = useState(false);
  const [beerHistory, setBeerHistory] = useState<BeerEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipant = useCallback(async () => {
    if (!activeEvent?.id || !token || !id) return;

    try {
      setError(null);
      const users = await api.get<EventUser[]>(
        `/events/${activeEvent.id}/users`,
        token
      );
      const found = Array.isArray(users) ? users.find((u) => u.id === id) : null;
      setParticipant(found ?? null);
      if (!found) setError('Účastník nenalezen');
    } catch (e: unknown) {
      if (parseError(e).isNetworkError) {
        logBackgroundError(e, 'FetchParticipant');
      } else {
        const err = e as { message?: string };
        setError(err?.message ?? 'Nepodařilo se načíst účastníka');
      }
    }
  }, [activeEvent?.id, token, id]);

  const fetchBeerHistory = useCallback(async () => {
    if (!activeEvent?.id || !token || !id) return;
    setHistoryLoading(true);
    try {
      const beers = await api.get<BeerEntry[]>(
        `/events/${activeEvent.id}/users/${id}/beers?includeDeleted=true`,
        token
      );
      const list = Array.isArray(beers) ? beers : [];
      list.sort((a, b) => new Date(b.consumedAt).getTime() - new Date(a.consumedAt).getTime());
      setBeerHistory(list);
    } catch (e) {
      logBackgroundError(e, 'FetchBeerHistory');
      setBeerHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [activeEvent?.id, token, id]);

  useEffect(() => {
    setIsLoading(true);
    fetchParticipant().finally(() => setIsLoading(false));
  }, [fetchParticipant]);

  useEffect(() => {
    if (participant?.id && activeEvent?.id) fetchBeerHistory();
  }, [participant?.id, activeEvent?.id, fetchBeerHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchParticipant(), fetchBeerHistory()]);
    setRefreshing(false);
  }, [fetchParticipant, fetchBeerHistory]);

  const handleRemoveFromEvent = useCallback(() => {
    if (!activeEvent?.id || !token || !id) return;

    Alert.alert(
      'Odebrat z události',
      'Opravdu chcete tohoto účastníka odebrat z události? Účet uživatele zůstane zachován, pouze bude odpojen od této události.',
      [
        { text: 'Zrušit', style: 'cancel' },
        {
          text: 'Odebrat',
          style: 'destructive',
          onPress: async () => {
            setRemoving(true);
            try {
              await api.delete(`/events/${activeEvent.id}/users/${id}`, token);
              router.back();
            } catch (e: unknown) {
              if (parseError(e).isNetworkError || parseError(e).isOfflineQueued) {
                logBackgroundError(e, 'RemoveParticipantFromEvent');
              } else {
                const err = e as { message?: string };
                Alert.alert('Chyba', err?.message ?? 'Účastníka se nepodařilo odebrat.');
              }
            } finally {
              setRemoving(false);
            }
          },
        },
      ]
    );
  }, [activeEvent?.id, token, id, router]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        scroll: { flex: 1 },
        scrollContent: { padding: 16, paddingBottom: 32 },
        profileSection: { alignItems: 'center', marginBottom: 20 },
        avatar: {
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: colors.textSecondary,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 12,
        },
        avatarText: { fontSize: 28, fontWeight: '600', color: '#fff' },
        name: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 2 },
        username: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
        roleBadge: {
          backgroundColor: colors.bgSecondary,
          borderRadius: 20,
          paddingHorizontal: 10,
          paddingVertical: 4,
        },
        roleText: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
        statsRow: { flexDirection: 'row' as const, gap: 12, marginBottom: 24 },
        statCard: {
          flex: 1,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          borderRadius: 12,
        },
        detailsSection: { marginBottom: 24 },
        sectionTitle: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.textSecondary,
          marginBottom: 8,
          letterSpacing: 0.15,
        },
        detailsCard: {
          backgroundColor: colors.card,
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.cardBorder,
        },
        detailRow: {
          flexDirection: 'row' as const,
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        detailRowLast: { borderBottomWidth: 0 },
        detailLabel: { fontSize: 15, color: colors.textSecondary },
        detailValue: { fontSize: 15, fontWeight: '500', color: colors.text },
        historyCard: {
          backgroundColor: colors.card,
          borderRadius: 12,
          padding: 16,
          minHeight: 80,
          borderWidth: 1,
          borderColor: colors.cardBorder,
        },
        historyRow: {
          flexDirection: 'row' as const,
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        historyRowLast: { borderBottomWidth: 0 },
        historyRowRemoved: { opacity: 0.7 },
        historyLeft: { flexDirection: 'row' as const, alignItems: 'center', gap: 10, flex: 1 },
        historyRight: { flexDirection: 'row' as const, alignItems: 'center', gap: 8 },
        historyAddRemove: { alignItems: 'center', justifyContent: 'center', minWidth: 24 },
        historyTime: { fontSize: 14, color: colors.text, fontWeight: '500' },
        historyTimeMuted: { color: colors.textMuted },
        historySize: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
        historyPlaceholder: { fontSize: 14, color: colors.textMuted, textAlign: 'center' as const, paddingVertical: 16 },
        spilledBadge: {
          flexDirection: 'row' as const,
          alignItems: 'center',
          gap: 4,
          backgroundColor: colors.amberBg,
          paddingHorizontal: 6,
          paddingVertical: 3,
          borderRadius: 6,
        },
        spilledText: { fontSize: 11, color: colors.amber, fontWeight: '500' },
        actionsSection: { marginTop: 8, paddingHorizontal: 4 },
        removeFromEventBtn: {
          flexDirection: 'row' as const,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 14,
          borderRadius: 12,
          backgroundColor: colors.red,
        },
        removeFromEventBtnDisabled: { opacity: 0.6 },
        removeFromEventBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
      }),
    [colors]
  );

  if (isLoading) {
    return <LoadingScreen showLogo={false} />;
  }

  if (error || !participant) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Účastník" showBack />
        <ErrorView message={error ?? 'Účastník nenalezen'} onRetry={fetchParticipant} />
      </SafeAreaView>
    );
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'OPERATOR':
        return 'Operátor';
      case 'USER':
        return 'Uživatel';
      case 'PARTICIPANT':
        return 'Účastník';
      default:
        return role;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Detail účastníka" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(participant.name || participant.username || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{participant.name || participant.username}</Text>
          <Text style={styles.username}>@{participant.username}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{getRoleLabel(participant.role)}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            icon={<Icon name="beer" size={22} color={colors.textMuted} />}
            label="Počet piv"
            value={participant.eventBeerCount ?? 0}
            color={colors.text}
            style={styles.statCard}
          />
          <StatCard
            icon={<Icon name="clock" size={22} color={colors.textMuted} />}
            label="Poslední pivo"
            value={participant.lastBeerTime ? formatRelativeTime(participant.lastBeerTime) : '–'}
            color={colors.text}
            style={styles.statCard}
          />
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Podrobnosti</Text>
          <View style={styles.detailsCard}>
            {participant.firstName && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Jméno</Text>
                <Text style={styles.detailValue}>{participant.firstName}</Text>
              </View>
            )}
            {participant.lastName && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Příjmení</Text>
                <Text style={styles.detailValue}>{participant.lastName}</Text>
              </View>
            )}
            {participant.email && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{participant.email}</Text>
              </View>
            )}
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <Text style={styles.detailLabel}>Pohlaví</Text>
              <Text style={styles.detailValue}>
                {participant.gender === 'MALE' ? 'Muž' : 'Žena'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Historie piv</Text>
          <View style={styles.historyCard}>
            {historyLoading ? (
              <Text style={styles.historyPlaceholder}>Načítání…</Text>
            ) : beerHistory.length === 0 ? (
              <Text style={styles.historyPlaceholder}>Žádná data</Text>
            ) : (
              beerHistory.map((b, idx) => {
                const isRemoved = !!b.deletedAt;
                const vol = b.volumeLitres != null ? Number(b.volumeLitres) : 0.5;
                return (
                  <View
                    key={b.id}
                    style={[
                      styles.historyRow,
                      idx === beerHistory.length - 1 && styles.historyRowLast,
                      isRemoved && styles.historyRowRemoved,
                    ]}
                  >
                    <View style={styles.historyLeft}>
                      <View style={styles.historyAddRemove}>
                        {isRemoved ? (
                          <Icon name="remove" size={16} color={colors.red} />
                        ) : (
                          <Icon name="add" size={16} color={colors.green} />
                        )}
                      </View>
                      <Text style={[styles.historyTime, isRemoved && styles.historyTimeMuted]}>
                        {formatDateTimeLong(b.consumedAt)}
                      </Text>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={[styles.historySize, isRemoved && styles.historyTimeMuted]}>
                        {formatLitres(vol)}
                      </Text>
                      {b.spilled && (
                        <View style={styles.spilledBadge}>
                          <Icon name="spill" size={12} color={colors.amber} />
                          <Text style={styles.spilledText}>rozlití</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.removeFromEventBtn, removing && styles.removeFromEventBtnDisabled]}
            onPress={handleRemoveFromEvent}
            disabled={removing}
          >
            <Icon name="remove" size={20} color="#fff" />
            <Text style={styles.removeFromEventBtnText}>
              {removing ? 'Odebírání…' : 'Odebrat z události'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
