import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActiveEvent } from '../../../../hooks/useActiveEvent';
import { useAuthStore } from '../../../../store/auth.store';
import { api } from '../../../../services/api';
import { websocketService } from '../../../../services/websocket.service';
import { StatCard } from '../../../../components/cards/StatCard';
import { Icon } from '../../../../components/icons';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../../components/ui/EmptyState';
import type { DashboardStats } from '@demonicka/shared-types';

export default function DashboardScreen() {
  const { activeEvent, isLoading: eventLoading } = useActiveEvent();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!activeEvent?.id || !token) return;

    try {
      const data = await api.get<DashboardStats>(
        `/dashboard/overview?eventId=${activeEvent.id}`,
        token
      );
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  }, [activeEvent?.id, token]);

  useEffect(() => {
    if (activeEvent?.id) {
      setIsLoading(true);
      fetchStats().finally(() => setIsLoading(false));
    }
  }, [activeEvent?.id, fetchStats]);

  useEffect(() => {
    const unsubscribe = websocketService.subscribe('dashboard:stats:update', (data) => {
      setStats(data as DashboardStats);
    });
    return () => unsubscribe();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, [fetchStats]);

  if (eventLoading || isLoading) {
    return <LoadingScreen showLogo={false} />;
  }

  if (!activeEvent) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <EmptyState
          icon={<Icon name="calendar" size={48} color="#9ca3af" />}
          title="Žádná aktivní událost"
          message="Momentálně není aktivní žádná událost."
        />
      </SafeAreaView>
    );
  }

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
          <Text style={styles.greeting}>Ahoj, {user?.name || user?.username}!</Text>
          <Text style={styles.eventName}>{activeEvent.name}</Text>
        </View>

        {stats && (
          <>
            <View style={styles.statsRow}>
              <StatCard
                icon={<Icon name="beer" size={24} color="#FF0000" />}
                label="Celkem piv"
                value={stats.totalBeers ?? 0}
                style={styles.statCard}
              />
              <StatCard
                icon={<Icon name="chart" size={24} color="#FF0000" />}
                label="Litrů"
                value={stats.totalLitres != null ? Number(stats.totalLitres).toFixed(1) : '0.0'}
                style={styles.statCard}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                icon={<Icon name="group" size={24} color="#3b82f6" />}
                label="Účastníků"
                value={stats.totalUsers ?? 0}
                color="#3b82f6"
                style={styles.statCard}
              />
              <StatCard
                icon={<Icon name="barrel" size={24} color="#f59e0b" />}
                label="Sudů"
                value={stats.totalBarrels ?? 0}
                color="#f59e0b"
                style={styles.statCard}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                icon={<Icon name="chart" size={24} color="#10b981" />}
                label="Průměr na osobu"
                value={stats.averageBeersPerUser != null ? Number(stats.averageBeersPerUser).toFixed(1) : '0.0'}
                color="#10b981"
                style={styles.statCardFull}
              />
            </View>
            {stats.topUsers && stats.topUsers.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top účastníci</Text>
                {stats.topUsers.slice(0, 5).map((user, index) => (
                  <View key={user.id} style={styles.leaderItem}>
                    <Text style={styles.leaderRank}>{index + 1}.</Text>
                    <Text style={styles.leaderName}>{user.name || user.username}</Text>
                    <Text style={styles.leaderValue}>{user.beerCount ?? 0} piv</Text>
                  </View>
                ))}
              </View>
            )}
          </>
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
  eventName: { fontSize: 15, color: '#6b7280' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1 },
  statCardFull: { flex: 1 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111', marginBottom: 12 },
  leaderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  leaderRank: { fontSize: 16, fontWeight: '600', color: '#6b7280', width: 30 },
  leaderName: { flex: 1, fontSize: 15, color: '#111' },
  leaderValue: { fontSize: 15, fontWeight: '600', color: '#FF0000' },
});
