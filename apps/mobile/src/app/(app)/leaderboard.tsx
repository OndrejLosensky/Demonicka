import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActiveEvent } from '../../hooks/useActiveEvent';
import { api } from '../../services/api';
import { Header } from '../../components/layout/Header';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { EmptyState } from '../../components/ui/EmptyState';
import { Icon } from '../../components/icons';
import { formatLitres } from '../../utils/format';
import type { LeaderboardData, UserLeaderboardData } from '@demonicka/shared-types';

function Row({ item }: { item: UserLeaderboardData }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rank}>#{item.rank}</Text>
      <Text style={styles.username} numberOfLines={1}>
        @{item.username}
      </Text>
      <View style={styles.right}>
        <Text style={styles.metric}>{item.beerCount}</Text>
        <Text style={styles.metricSub}>{formatLitres(item.totalLitres)}</Text>
      </View>
    </View>
  );
}

function Section({ title, data }: { title: string; data: UserLeaderboardData[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.headerRank}>#</Text>
          <Text style={styles.headerUser}>Uživatel</Text>
          <Text style={styles.headerMetrics}>Piva / Litry</Text>
        </View>
        {data.length === 0 ? (
          <View style={styles.emptyList}>
            <Text style={styles.emptyListText}>Zatím žádná data</Text>
          </View>
        ) : (
          data.map((u) => <Row key={u.id} item={u} />)
        )}
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const { activeEvent, isLoading: eventLoading } = useActiveEvent();
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const subtitle = useMemo(() => {
    if (activeEvent?.name) return activeEvent.name;
    return 'Celkově';
  }, [activeEvent?.name]);

  const fetchLeaderboard = useCallback(async () => {
    const eventId = activeEvent?.id;
    const path = eventId
      ? `/dashboard/leaderboard?eventId=${encodeURIComponent(eventId)}`
      : '/dashboard/leaderboard';
    const data = await api.get<LeaderboardData>(path);
    setLeaderboard(data);
  }, [activeEvent?.id]);

  useEffect(() => {
    setIsLoading(true);
    fetchLeaderboard()
      .catch(() => setLeaderboard(null))
      .finally(() => setIsLoading(false));
  }, [fetchLeaderboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchLeaderboard();
    } finally {
      setRefreshing(false);
    }
  }, [fetchLeaderboard]);

  if (eventLoading || isLoading) {
    return <LoadingScreen showLogo={false} />;
  }

  const males = leaderboard?.males ?? [];
  const females = leaderboard?.females ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Žebříček" subtitle={subtitle} showBack />

      {!leaderboard ? (
        <EmptyState
          icon={<Icon name="chart" size={48} color="#9ca3af" />}
          title="Nepodařilo se načíst žebříček"
          message="Zkuste to prosím znovu."
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF0000" />
          }
        >
          <Section title="Muži" data={males} />
          <Section title="Ženy" data={females} />

          <View style={styles.note}>
            <Text style={styles.noteText}>
              Pozn.: Beer pong zde záměrně není.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 12 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 6,
  },
  headerRank: { width: 48, fontSize: 12, fontWeight: '600', color: '#6b7280' },
  headerUser: { flex: 1, fontSize: 12, fontWeight: '600', color: '#6b7280' },
  headerMetrics: { width: 96, textAlign: 'right', fontSize: 12, fontWeight: '600', color: '#6b7280' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  rank: { width: 48, fontSize: 14, fontWeight: '600', color: '#111' },
  username: { flex: 1, fontSize: 14, color: '#111', fontWeight: '500' },
  right: { width: 96, alignItems: 'flex-end' },
  metric: { fontSize: 14, fontWeight: '700', color: '#111' },
  metricSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  emptyList: { paddingVertical: 18, alignItems: 'center' },
  emptyListText: { fontSize: 13, color: '#9ca3af' },
  note: { paddingTop: 8 },
  noteText: { fontSize: 12, color: '#9ca3af', textAlign: 'center', fontStyle: 'italic' },
});

