import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActiveEvent } from '../../../../hooks/useActiveEvent';
import { useAuthStore } from '../../../../store/auth.store';
import { api } from '../../../../services/api';
import { logBackgroundError } from '../../../../utils/errorHandler';
import { Icon } from '../../../../components/icons';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { AddBarrelModal, type BarrelSize } from '../../../../components/barrels/AddBarrelModal';
import { formatLitres, formatNumber } from '../../../../utils/format';
import { useThemeColors } from '../../../../hooks/useThemeColors';
import type { Barrel } from '@demonicka/shared-types';

/** Beer volume in litres for display (large = 0.5L, we use large for count) */
const BEER_VOLUME_LITRES = 0.5;

export default function BarrelsScreen() {
  const router = useRouter();
  const { activeEvent, isLoading: eventLoading } = useActiveEvent();
  const token = useAuthStore((state) => state.token);
  const colors = useThemeColors();

  const [barrels, setBarrels] = useState<Barrel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);

  const fetchBarrels = useCallback(async () => {
    if (!activeEvent?.id || !token) return;

    try {
      const data = await api.get<Barrel[]>(
        `/events/${activeEvent.id}/barrels`,
        token
      );
      setBarrels(data);
    } catch (error) {
      logBackgroundError(error, 'FetchBarrels');
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

  const handleAddBarrel = useCallback(
    async (size: BarrelSize) => {
      if (!token || !activeEvent?.id) return;

      const eventBarrels = await api.get<Barrel[]>(
        `/events/${activeEvent.id}/barrels`,
        token
      );
      const usedNumbers = new Set(eventBarrels.map((b) => b.orderNumber));
      let orderNumber = 1;
      while (usedNumbers.has(orderNumber)) orderNumber++;

      const barrel = await api.post<Barrel>(
        '/barrels',
        { size, orderNumber },
        token
      );
      await api.put(
        `/events/${activeEvent.id}/barrels/${barrel.id}`,
        {},
        token
      );
      await api.patch(`/barrels/${barrel.id}/activate`, {}, token);
      await fetchBarrels();
    },
    [token, activeEvent?.id, fetchBarrels]
  );

  const renderBarrel = ({ item }: { item: Barrel }) => {
    const totalLitres = Number(item.totalLitres ?? 0);
    const remainingLitres = Number(item.remainingLitres ?? 0);
    const progress =
      totalLitres > 0 ? ((totalLitres - remainingLitres) / totalLitres) * 100 : 0;
    const totalBeers = Math.round(totalLitres / BEER_VOLUME_LITRES);
    const remainingBeers = Math.floor(remainingLitres / BEER_VOLUME_LITRES);

    return (
      <TouchableOpacity
        style={[styles.barrelCard, { backgroundColor: colors.card }]}
        onPress={() => router.push(`/(app)/(tabs)/barrels/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.barrelHeader}>
          <View style={styles.barrelTitle}>
            <Text style={[styles.barrelNumber, { color: colors.text }]}>Sud #{item.orderNumber}</Text>
            <View style={[styles.statusBadge, { backgroundColor: colors.border }, item.isActive && { backgroundColor: colors.greenBg }]}>
              <Text style={[styles.statusText, { color: colors.textMuted }, item.isActive && { color: colors.green }]}>
                {item.isActive ? 'Aktivní' : 'Prázdný'}
              </Text>
            </View>
          </View>
          <Text style={[styles.barrelSize, { color: colors.textMuted }]}>{item.size}L</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textMuted }]}>{progress.toFixed(0)}% vypito</Text>
        </View>

        <View style={styles.barrelStats}>
          <View style={styles.barrelStat}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Zbývá piv</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{formatNumber(remainingBeers)}</Text>
          </View>
          <View style={styles.barrelStat}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Zbývá litrů</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{formatLitres(item.remainingLitres)}</Text>
          </View>
          <View style={styles.barrelStat}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Celkem piv</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{formatNumber(totalBeers)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (eventLoading || isLoading) {
    return <LoadingScreen showLogo={false} />;
  }

  if (!activeEvent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
        <EmptyState
          icon={<Icon name="calendar" size={48} color={colors.textMuted} />}
          title="Žádná aktivní událost"
          message="Momentálně není aktivní žádná událost."
        />
      </SafeAreaView>
    );
  }

  const activeBarrel = barrels.find((b) => b.isActive);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Sudy</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {barrels.length} sudů • {activeBarrel ? `Aktivní: #${activeBarrel.orderNumber}` : 'Žádný aktivní'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setAddModalVisible(true)}
        >
          <Icon name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Přidat</Text>
        </TouchableOpacity>
      </View>

      <AddBarrelModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSubmit={handleAddBarrel}
      />

      <FlatList
        data={barrels}
        keyExtractor={(item) => item.id}
        renderItem={renderBarrel}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Icon name="barrel" size={48} color={colors.textMuted} />}
            title="Žádné sudy"
            message="Tato událost zatím nemá žádné sudy."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 15, marginTop: 4 },
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
  listContent: { padding: 16, paddingTop: 8, paddingBottom: 32, flexGrow: 1 },
  barrelCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
  barrelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  barrelTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barrelNumber: { fontSize: 17, fontWeight: '600' },
  barrelSize: { fontSize: 15, fontWeight: '600' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  progressContainer: { marginBottom: 12 },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF0000',
    borderRadius: 4,
  },
  progressText: { fontSize: 12, textAlign: 'right' },
  barrelStats: { flexDirection: 'row', justifyContent: 'space-between' },
  barrelStat: { alignItems: 'center' },
  statLabel: { fontSize: 12, marginBottom: 2 },
  statValue: { fontSize: 15, fontWeight: '600' },
});
