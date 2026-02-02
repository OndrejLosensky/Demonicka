import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActiveEvent } from '../../../../hooks/useActiveEvent';
import { useAuthStore } from '../../../../store/auth.store';
import { api } from '../../../../services/api';
import { Icon } from '../../../../components/icons';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { formatLitres, formatNumber } from '../../../../utils/format';
import type { Barrel } from '@demonicka/shared-types';

/** Beer volume in litres for display (large = 0.5L, we use large for count) */
const BEER_VOLUME_LITRES = 0.5;

export default function BarrelsScreen() {
  const { activeEvent, isLoading: eventLoading } = useActiveEvent();
  const token = useAuthStore((state) => state.token);

  const [barrels, setBarrels] = useState<Barrel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBarrels = useCallback(async () => {
    if (!activeEvent?.id || !token) return;

    try {
      const data = await api.get<Barrel[]>(
        `/events/${activeEvent.id}/barrels`,
        token
      );
      setBarrels(data);
    } catch (error) {
      console.error('Failed to fetch barrels:', error);
    }
  }, [activeEvent?.id, token]);

  useEffect(() => {
    if (activeEvent?.id) {
      setIsLoading(true);
      fetchBarrels().finally(() => setIsLoading(false));
    }
  }, [activeEvent?.id, fetchBarrels]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBarrels();
    setRefreshing(false);
  }, [fetchBarrels]);

  const renderBarrel = ({ item }: { item: Barrel }) => {
    const totalLitres = Number(item.totalLitres ?? 0);
    const remainingLitres = Number(item.remainingLitres ?? 0);
    const progress =
      totalLitres > 0 ? ((totalLitres - remainingLitres) / totalLitres) * 100 : 0;
    const totalBeers = Math.round(totalLitres / BEER_VOLUME_LITRES);
    const remainingBeers = Math.floor(remainingLitres / BEER_VOLUME_LITRES);

    return (
      <View style={styles.barrelCard}>
        <View style={styles.barrelHeader}>
          <View style={styles.barrelTitle}>
            <Text style={styles.barrelNumber}>Sud #{item.orderNumber}</Text>
            <View style={[styles.statusBadge, item.isActive && styles.statusActive]}>
              <Text style={[styles.statusText, item.isActive && styles.statusTextActive]}>
                {item.isActive ? 'Aktivní' : 'Prázdný'}
              </Text>
            </View>
          </View>
          <Text style={styles.barrelSize}>{item.size}L</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress.toFixed(0)}% vypito</Text>
        </View>

        <View style={styles.barrelStats}>
          <View style={styles.barrelStat}>
            <Text style={styles.statLabel}>Zbývá piv</Text>
            <Text style={styles.statValue}>{formatNumber(remainingBeers)}</Text>
          </View>
          <View style={styles.barrelStat}>
            <Text style={styles.statLabel}>Zbývá litrů</Text>
            <Text style={styles.statValue}>{formatLitres(item.remainingLitres)}</Text>
          </View>
          <View style={styles.barrelStat}>
            <Text style={styles.statLabel}>Celkem piv</Text>
            <Text style={styles.statValue}>{formatNumber(totalBeers)}</Text>
          </View>
        </View>
      </View>
    );
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

  const activeBarrel = barrels.find((b) => b.isActive);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Sudy</Text>
        <Text style={styles.subtitle}>
          {barrels.length} sudů • {activeBarrel ? `Aktivní: #${activeBarrel.orderNumber}` : 'Žádný aktivní'}
        </Text>
      </View>

      <FlatList
        data={barrels}
        keyExtractor={(item) => item.id}
        renderItem={renderBarrel}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF0000" />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Icon name="barrel" size={48} color="#9ca3af" />}
            title="Žádné sudy"
            message="Tato událost zatím nemá žádné sudy."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 32,
    flexGrow: 1,
  },
  barrelCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  barrelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  barrelTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barrelNumber: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },
  barrelSize: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  statusBadge: {
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusActive: {
    backgroundColor: '#dcfce7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  statusTextActive: {
    color: '#16a34a',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF0000',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  barrelStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barrelStat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
});
