import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth.store';
import { api } from '../../services/api';
import { StatCard } from '../cards/StatCard';
import { Icon } from '../icons';
import { LoadingScreen } from '../ui/LoadingScreen';
import { EmptyState } from '../ui/EmptyState';

type UserDashboardOverview = {
  user: { id: string; username: string; name: string | null };
  totals: {
    beers: number;
    eventBeers: number;
    participatedEvents: number;
    totalBeers: number;
  };
  topEvents: Array<{
    eventId: string;
    eventName: string;
    userBeers: number;
    totalEventBeers: number;
    sharePercent: number;
  }>;
  beerPong: {
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
  };
};

export function PersonalOverviewScreen() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const [data, setData] = useState<UserDashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOverview = useCallback(async () => {
    if (!token || !user?.username) return;
    try {
      const res = await api.get<UserDashboardOverview>(
        `/dashboard/user/overview?username=${encodeURIComponent(user.username)}`,
        token
      );
      setData(res);
    } catch (error) {
      console.error('Failed to fetch personal overview:', error);
    }
  }, [token, user?.username]);

  useEffect(() => {
    setIsLoading(true);
    fetchOverview().finally(() => setIsLoading(false));
  }, [fetchOverview]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOverview();
    setRefreshing(false);
  }, [fetchOverview]);

  if (isLoading) {
    return <LoadingScreen showLogo={false} />;
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <EmptyState
          icon={<Icon name="chart" size={48} color="#9ca3af" />}
          title="Nepodařilo se načíst statistiky"
          message="Zkuste to prosím znovu později."
        />
      </SafeAreaView>
    );
  }

  const { totals, topEvents, beerPong } = data;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF0000" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Ahoj, {data.user.name || data.user.username}!</Text>
          <Text style={styles.subtitle}>Přehled statistik @{data.user.username}</Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            icon={<Icon name="beer" size={24} color="#FF0000" />}
            label="Celkem piv"
            value={totals.totalBeers}
            style={styles.statCard}
          />
          <StatCard
            icon={<Icon name="chart" size={24} color="#3b82f6" />}
            label="Účast v událostech"
            value={totals.participatedEvents}
            color="#3b82f6"
            style={styles.statCard}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            icon={<Icon name="beer-pong" size={24} color="#f59e0b" />}
            label="Beer Pong (V/P)"
            value={`${beerPong.gamesWon}/${beerPong.gamesPlayed}`}
            color="#f59e0b"
            style={styles.statCardFull}
          />
        </View>

        {topEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top události</Text>
            {topEvents.slice(0, 5).map((e) => (
              <View key={e.eventId} style={styles.eventItem}>
                <Text style={styles.eventName}>{e.eventName}</Text>
                <Text style={styles.eventStats}>
                  {e.userBeers} piv • {e.sharePercent.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 24 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#6b7280' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1 },
  statCardFull: { flex: 1 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111', marginBottom: 12 },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  eventName: { fontSize: 15, fontWeight: '500', color: '#111', flex: 1 },
  eventStats: { fontSize: 14, color: '#6b7280', marginLeft: 12 },
});
