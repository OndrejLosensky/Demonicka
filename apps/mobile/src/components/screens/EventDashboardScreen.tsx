import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActiveEvent } from '../../hooks/useActiveEvent';
import { useAuthStore } from '../../store/auth.store';
import { api } from '../../services/api';
import { logBackgroundError } from '../../utils/errorHandler';
import { websocketService } from '../../services/websocket.service';
import { LoadingScreen } from '../ui/LoadingScreen';
import { EmptyState } from '../ui/EmptyState';
import { Icon } from '../icons';
import { DashboardKpiRow } from '../dashboard/DashboardKpiRow';
import { DashboardHourlyChart } from '../dashboard/DashboardHourlyChart';
import { DashboardActiveBarrel } from '../dashboard/DashboardActiveBarrel';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { DashboardStats } from '@demonicka/shared-types';

type HourlyPoint = { hour: number; count: number };

function formatEta(asOfIso: string, emptyAtIso: string): { relative: string; absolute: string } | null {
  const asOf = new Date(asOfIso).getTime();
  const emptyAt = new Date(emptyAtIso).getTime();
  const diffMs = Math.max(0, emptyAt - asOf);
  const totalMinutes = Math.round(diffMs / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const relative = h > 0 ? `${h} h ${m} min` : `${m} min`;
  const d = new Date(emptyAtIso);
  const absolute = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  return { relative, absolute };
}

function formatDateCs(d: Date): string {
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function EventDashboardScreen() {
  const { activeEvent, isLoading: eventLoading } = useActiveEvent();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const colors = useThemeColors();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [hourly, setHourly] = useState<HourlyPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [barrels, setBarrels] = useState<Array<{ isActive: boolean; totalLitres: number; remainingLitres: number }>>([]);

  const fetchData = useCallback(async () => {
    if (!activeEvent?.id || !token) return;
    try {
      const dateParam = new Date().toISOString().slice(0, 10);
      const [statsData, hourlyData, barrelsData] = await Promise.all([
        api.get<DashboardStats>(`/dashboard/overview?eventId=${activeEvent.id}`, token),
        api.get<HourlyPoint[]>(`/dashboard/hourly-stats?eventId=${activeEvent.id}&date=${dateParam}`, token),
        api.get<Array<{ isActive: boolean; totalLitres: number; remainingLitres: number }>>(
          `/events/${activeEvent.id}/barrels`,
          token
        ),
      ]);
      setStats(statsData);
      setHourly(Array.isArray(hourlyData) ? hourlyData : []);
      setBarrels(Array.isArray(barrelsData) ? barrelsData : []);
    } catch (error) {
      logBackgroundError(error, 'FetchDashboard');
    }
  }, [activeEvent?.id, token]);

  useEffect(() => {
    if (activeEvent?.id) {
      setIsLoading(true);
      fetchData().finally(() => setIsLoading(false));
    }
  }, [activeEvent?.id, fetchData]);

  useEffect(() => {
    const unsubscribe = websocketService.subscribe('dashboard:stats:update', (data) => {
      const payload = data as { dashboard?: DashboardStats };
      if (payload.dashboard) setStats(payload.dashboard);
    });
    return () => unsubscribe();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

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

  const participantsCount = stats?.totalUsers ?? 0;
  const totalBeers = stats?.totalBeers ?? 0;
  const totalLitresSum = barrels.reduce((s, b) => s + Number(b.totalLitres || 0), 0);
  const totalLitres = stats?.totalLitres ?? totalLitresSum;
  const avgPerPerson = participantsCount > 0 ? totalBeers / participantsCount : 0;
  const eventPace = stats?.eventPace;
  const avgPerHourValue =
    typeof eventPace?.avgBeersPerActiveHour === 'number' && Number.isFinite(eventPace.avgBeersPerActiveHour)
      ? eventPace.avgBeersPerActiveHour.toFixed(1)
      : '—';
  const currentPace = eventPace?.currentBeersPerHour ?? null;
  const windowMinutes = eventPace?.windowMinutes ?? 60;
  const avgPerHourSubtitle =
    typeof currentPace === 'number' && Number.isFinite(currentPace)
      ? `${currentPace.toFixed(1)}/h (posledních ${windowMinutes} min)`
      : undefined;

  const activeBarrelsCount = barrels.filter((b) => b.isActive).length;
  const totalBarrels = barrels.length || (stats?.totalBarrels ?? 0);
  const prediction = stats?.barrelPrediction;
  const activeBarrel = prediction?.barrel;
  const currentEta =
    prediction?.eta?.emptyAtByCurrent && prediction?.asOf
      ? formatEta(prediction.asOf, prediction.eta.emptyAtByCurrent)
      : null;
  const historicalEta =
    prediction?.eta?.emptyAtByHistorical && prediction?.asOf
      ? formatEta(prediction.asOf, prediction.eta.emptyAtByHistorical)
      : null;

  const peak = hourly.reduce((max, cur) => (cur.count > max.count ? cur : max), { hour: 0, count: 0 });
  const peakHourLabel = peak.count > 0 ? `${peak.hour.toString().padStart(2, '0')}:00` : 'Žádná data';
  const topDrinkerUsername = stats?.topUsers?.[0]?.username ?? 'Nikdo';
  const eventStartedAt = activeEvent?.startDate ? formatDateCs(new Date(activeEvent.startDate)) : '';

  const kpiItems = [
    { title: 'Celkem piv', value: totalBeers, subtitle: `${totalLitres.toFixed(1)} L` },
    {
      title: 'Průměr / hod',
      value: avgPerHourValue,
      subtitle: avgPerHourSubtitle ?? '0.0/h (posledních 60 min)',
    },
    { title: 'průměr / os.', value: avgPerPerson.toFixed(1) },
    { title: 'Aktivní sudy', value: totalBarrels },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Přehled</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{activeEvent.name}</Text>
        </View>
        <TouchableOpacity style={[styles.refreshBtn, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={onRefresh} disabled={refreshing}>
          <Icon name="refresh" size={18} color={colors.text} />
          <Text style={[styles.refreshText, { color: colors.text }]}>Obnovit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <DashboardKpiRow items={kpiItems} />

        <View style={styles.chartRow}>
          <View style={styles.chartCol}>
            <DashboardHourlyChart hourly={hourly} dateLabel={formatDateCs(new Date())} />
          </View>
          <View style={styles.barrelCol}>
            <DashboardActiveBarrel
              barrel={activeBarrel}
              currentEta={currentEta}
              historicalEta={historicalEta}
              status={prediction?.status}
            />
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Nejlepší uživatelé</Text>
            {stats?.topUsers && stats.topUsers.length > 0 ? (
              stats.topUsers.slice(0, 4).map((u, idx) => (
                <View key={u.id} style={[styles.userItem, { borderBottomColor: colors.border }, idx === 0 && styles.userItemFirst]}>
                  <View style={[styles.userRankWrap, { backgroundColor: colors.border }, idx === 0 && styles.userRankFirst]}>
                    <Text style={[styles.userRank, { color: colors.textMuted }, idx === 0 && styles.userRankTextFirst]}>{idx + 1}</Text>
                  </View>
                  <Text style={[styles.userName, { color: colors.text }]}>{u.username}</Text>
                  <Text style={[styles.userBeers, { color: colors.textMuted }]}>{u.beerCount} piv</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.empty, { color: colors.textMuted }]}>Zatím žádná data.</Text>
            )}
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Insights</Text>
            <View style={[styles.insightItem, { borderBottomColor: colors.border }]}>
              <Text style={[styles.insightLabel, { color: colors.textMuted }]}>Začátek</Text>
              <Text style={[styles.insightValue, { color: colors.text }]}>{eventStartedAt || '—'}</Text>
            </View>
            <View style={[styles.insightItem, { borderBottomColor: colors.border }]}>
              <Text style={[styles.insightLabel, { color: colors.textMuted }]}>Peak</Text>
              <Text style={[styles.insightValue, { color: colors.text }]}>
                {peakHourLabel}
                {peak.count > 0 && ` (${peak.count} piv)`}
              </Text>
            </View>
            <View style={[styles.insightItem, { borderBottomColor: colors.border }]}>
              <Text style={[styles.insightLabel, { color: colors.textMuted }]}>Top uživatel</Text>
              <Text style={[styles.insightValue, { color: colors.text }]}>{topDrinkerUsername}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 2 },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  refreshText: { fontSize: 14, fontWeight: '600' },
  chartRow: { flexDirection: 'column', gap: 16, marginBottom: 16 },
  chartCol: { width: '100%' },
  barrelCol: { width: '100%' },
  bottomRow: { flexDirection: 'column', gap: 16 },
  section: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  userItemFirst: { backgroundColor: 'rgba(255, 59, 48, 0.05)' },
  userRankWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userRank: { fontSize: 12, fontWeight: '700' },
  userRankFirst: { backgroundColor: '#ff3b30' },
  userRankTextFirst: { color: '#fff' },
  userName: { flex: 1, fontSize: 14, fontWeight: '600' },
  userBeers: { fontSize: 13 },
  empty: { fontSize: 13 },
  insightItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  insightLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  insightValue: { fontSize: 13, fontWeight: '600' },
});
