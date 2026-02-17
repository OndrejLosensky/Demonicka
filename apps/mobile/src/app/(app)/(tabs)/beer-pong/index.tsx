import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActiveEvent } from '../../../../hooks/useActiveEvent';
import { useAuthStore } from '../../../../store/auth.store';
import { api } from '../../../../services/api';
import { Icon } from '../../../../components/icons';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { CreateBeerPongModal } from '../../../../components/beer-pong/CreateBeerPongModal';
import type {
  BeerPongEvent,
  BeerPongEventStatus,
  CreateBeerPongEventDto,
} from '@demonicka/shared-types';

export default function BeerPongScreen() {
  const router = useRouter();
  const { activeEvent, isLoading: eventLoading } = useActiveEvent();
  const token = useAuthStore((state) => state.token);

  const [tournaments, setTournaments] = useState<BeerPongEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

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

  const handleCreateTournament = useCallback(
    async (data: CreateBeerPongEventDto) => {
      if (!activeEvent?.id || !token) return;
      await api.post('/beer-pong', { ...data, eventId: activeEvent.id }, token);
      await fetchTournaments();
    },
    [activeEvent?.id, token, fetchTournaments]
  );

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
        <View>
          <Text style={styles.title}>Beer Pong</Text>
          <Text style={styles.subtitle}>{activeEvent.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setCreateModalVisible(true)}
        >
          <Icon name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Přidat</Text>
        </TouchableOpacity>
      </View>

      <CreateBeerPongModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={handleCreateTournament}
      />

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
            message="Vytvořte první turnaj tlačítkem Přidat. Každý turnaj potřebuje 8 týmů pro start."
          />
        ) : (
          tournaments.map((tournament) => {
            const teamCount = tournament.teams?.length ?? 0;
            const gameCount = tournament.games?.length ?? 0;
            const canStart = teamCount === 8 && tournament.status === 'DRAFT';
            return (
              <TouchableOpacity
                key={tournament.id}
                style={styles.tournamentCard}
                activeOpacity={0.7}
                onPress={() => router.push(`/(app)/(tabs)/beer-pong/${tournament.id}`)}
              >
                <View style={styles.tournamentHeader}>
                  <Text style={styles.tournamentName} numberOfLines={1}>
                    {tournament.name}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tournament.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(tournament.status) }]}>
                      {getStatusLabel(tournament.status)}
                    </Text>
                  </View>
                </View>
                {tournament.description ? (
                  <Text style={styles.tournamentDescription} numberOfLines={2}>
                    {tournament.description}
                  </Text>
                ) : null}
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Týmy</Text>
                    <Text
                      style={[
                        styles.statValue,
                        canStart && styles.statValueSuccess,
                        teamCount === 8 && !canStart && styles.statValuePrimary,
                      ]}
                    >
                      {teamCount}/8
                    </Text>
                  </View>
                  {tournament.status === 'ACTIVE' && gameCount > 0 && (
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Zápasy</Text>
                      <Text style={styles.statValue}>{gameCount}</Text>
                    </View>
                  )}
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Piv/hráč</Text>
                    <Text style={styles.statValue}>{tournament.beersPerPlayer}</Text>
                  </View>
                </View>
                {canStart && (
                  <View style={styles.readyChip}>
                    <Text style={styles.readyChipText}>Připraveno ke startu</Text>
                  </View>
                )}
                {teamCount < 8 && tournament.status === 'DRAFT' && (
                  <Text style={styles.moreTeamsHint}>
                    Chybí {8 - teamCount} {8 - teamCount === 1 ? 'tým' : 'týmů'}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 15, color: '#6b7280', marginTop: 4 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FF0000',
  },
  addBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 8, paddingBottom: 32 },
  tournamentCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tournamentName: { fontSize: 17, fontWeight: '600', color: '#111', flex: 1, marginRight: 12 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  tournamentDescription: { fontSize: 14, color: '#6b7280', marginBottom: 10 },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 4,
  },
  stat: { minWidth: 64 },
  statLabel: { fontSize: 11, color: '#6b7280', marginBottom: 2 },
  statValue: { fontSize: 15, fontWeight: '600', color: '#111' },
  statValuePrimary: { color: '#2563eb' },
  statValueSuccess: { color: '#16a34a' },
  readyChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 10,
  },
  readyChipText: { fontSize: 12, fontWeight: '600', color: '#16a34a' },
  moreTeamsHint: { fontSize: 12, color: '#b45309', marginTop: 6 },
});
