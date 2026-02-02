import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActiveEvent } from '../../../../hooks/useActiveEvent';
import { useAuthStore } from '../../../../store/auth.store';
import { api } from '../../../../services/api';
import { Icon } from '../../../../components/icons';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../../components/ui/EmptyState';
import type { BeerPongEvent, BeerPongEventStatus } from '@demonicka/shared-types';

export default function BeerPongScreen() {
  const { activeEvent, isLoading: eventLoading } = useActiveEvent();
  const token = useAuthStore((state) => state.token);

  const [tournaments, setTournaments] = useState<BeerPongEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTournaments = useCallback(async () => {
    if (!activeEvent?.id || !token) return;
    try {
      const data = await api.get<BeerPongEvent[]>(`/events/${activeEvent.id}/beer-pong`, token);
      setTournaments(data);
    } catch (error) {
      console.error('Failed to fetch beer pong tournaments:', error);
    }
  }, [activeEvent?.id, token]);

  useEffect(() => {
    if (activeEvent?.id) {
      setIsLoading(true);
      fetchTournaments().finally(() => setIsLoading(false));
    }
  }, [activeEvent?.id, fetchTournaments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTournaments();
    setRefreshing(false);
  }, [fetchTournaments]);

  const getStatusLabel = (status: BeerPongEventStatus) => {
    switch (status) {
      case 'DRAFT': return 'Příprava';
      case 'ACTIVE': return 'Probíhá';
      case 'COMPLETED': return 'Dokončeno';
      default: return status;
    }
  };

  const getStatusColor = (status: BeerPongEventStatus) => {
    switch (status) {
      case 'DRAFT': return '#6b7280';
      case 'ACTIVE': return '#16a34a';
      case 'COMPLETED': return '#3b82f6';
      default: return '#6b7280';
    }
  };

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
      <View style={styles.header}>
        <Text style={styles.title}>Beer Pong</Text>
        <Text style={styles.subtitle}>{activeEvent.name}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF0000" />
        }
      >
        {tournaments.length === 0 ? (
          <EmptyState
            icon={<Icon name="beer-pong" size={48} color="#9ca3af" />}
            title="Žádné turnaje"
            message="Pro tuto událost zatím nebyly vytvořeny žádné Beer Pong turnaje."
          />
        ) : (
          tournaments.map((tournament) => (
            <TouchableOpacity key={tournament.id} style={styles.tournamentCard} activeOpacity={0.7}>
              <View style={styles.tournamentHeader}>
                <Text style={styles.tournamentName}>{tournament.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tournament.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(tournament.status) }]}>
                    {getStatusLabel(tournament.status)}
                  </Text>
                </View>
              </View>
              {tournament.description && (
                <Text style={styles.tournamentDescription}>{tournament.description}</Text>
              )}
              <View style={styles.tournamentMeta}>
                <Text style={styles.metaText}>{tournament.beersPerPlayer} piv/hráč</Text>
                <Text style={styles.metaText}>{tournament.timeWindowMinutes} min</Text>
                <Text style={styles.metaText}>{tournament.teams?.length ?? 0} týmů</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 15, color: '#6b7280', marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 8, paddingBottom: 32 },
  tournamentCard: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 12 },
  tournamentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tournamentName: { fontSize: 17, fontWeight: '600', color: '#111', flex: 1, marginRight: 12 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  tournamentDescription: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  tournamentMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaText: { fontSize: 13, color: '#6b7280' },
});
