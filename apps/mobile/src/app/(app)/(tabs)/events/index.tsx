import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../../store/auth.store';
import { api } from '../../../../services/api';
import { logBackgroundError } from '../../../../utils/errorHandler';
import { Icon } from '../../../../components/icons';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { formatDate } from '../../../../utils/format';
import { useThemeColors } from '../../../../hooks/useThemeColors';

type UserDashboardEvent = {
  eventId: string;
  eventName: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  userBeers: number;
  totalEventBeers: number;
  sharePercent: number;
  userSpilledBeers: number;
};

type UserDashboardEventList = {
  user: { id: string; username: string; name: string | null };
  events: UserDashboardEvent[];
};

export default function EventsHistoryScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const colors = useThemeColors();

  const [data, setData] = useState<UserDashboardEventList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!token || !user?.username) return;
    try {
      const res = await api.get<UserDashboardEventList>(
        `/dashboard/user/events?username=${encodeURIComponent(user.username)}`,
        token
      );
      setData(res);
    } catch (error) {
      logBackgroundError(error, 'FetchUserEvents');
    }
  }, [token, user?.username]);

  useEffect(() => {
    setIsLoading(true);
    fetchEvents().finally(() => setIsLoading(false));
  }, [fetchEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);

  if (isLoading) {
    return <LoadingScreen showLogo={false} />;
  }

  const events = data?.events ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: colors.text }]}>Události</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {data?.user ? `@${data.user.username} — přehled účasti` : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.leaderboardButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/leaderboard')}
            activeOpacity={0.8}
          >
            <Icon name="chart" size={18} color={colors.text} />
            <Text style={[styles.leaderboardButtonText, { color: colors.text }]}>Žebříček</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.eventId}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.eventName, { color: colors.text }]}>{item.eventName}</Text>
              {item.isActive && (
                <View style={[styles.activeBadge, { backgroundColor: colors.greenBg }]}>
                  <Text style={[styles.activeBadgeText, { color: colors.green }]}>Aktivní</Text>
                </View>
              )}
            </View>
            <Text style={[styles.dateText, { color: colors.textMuted }]}>
              {formatDate(item.startDate)}
              {item.endDate ? ` → ${formatDate(item.endDate)}` : ''}
            </Text>
            <View style={styles.chips}>
              <View style={[styles.chip, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                <Text style={[styles.chipText, { color: colors.textMuted }]}>Moje piva: {item.userBeers}</Text>
              </View>
              <View style={[styles.chip, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                <Text style={[styles.chipText, { color: colors.textMuted }]}>Celkem: {item.totalEventBeers}</Text>
              </View>
              <View style={[styles.chip, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                <Text style={[styles.chipText, { color: colors.textMuted }]}>Podíl: {item.sharePercent.toFixed(1)}%</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={<Icon name="calendar" size={48} color={colors.textMuted} />}
            title="Zatím žádná účast v událostech"
            message="Vaše historie účasti v událostech se zobrazí zde."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingBottom: 8 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headerLeft: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 15, marginTop: 4 },
  leaderboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  leaderboardButtonText: { fontSize: 14, fontWeight: '600' },
  listContent: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  eventName: { fontSize: 17, fontWeight: '600', flex: 1 },
  activeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  activeBadgeText: { fontSize: 12, fontWeight: '600' },
  dateText: { fontSize: 14, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  chipText: { fontSize: 13 },
});
