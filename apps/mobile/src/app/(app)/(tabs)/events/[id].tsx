import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../../store/auth.store';
import { api } from '../../../../services/api';
import { logBackgroundError } from '../../../../utils/errorHandler';
import { Icon } from '../../../../components/icons';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { useThemeColors } from '../../../../hooks/useThemeColors';
import { formatDate } from '../../../../utils/format';

type UserDashboardEventDetail = {
  user: { id: string; username: string; name: string | null };
  event: {
    id: string;
    name: string;
    startDate: string;
    endDate: string | null;
    isActive: boolean;
  };
  summary: {
    userBeers: number;
    userSpilledBeers: number;
    totalEventBeers: number;
    totalEventSpilledBeers: number;
    sharePercent: number;
  };
  hourly: Array<{ bucketUtc: string; count: number; spilled: number }>;
};

export default function EventDetailScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const colors = useThemeColors();

  const [data, setData] = useState<UserDashboardEventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!eventId || !token || !user?.username) return;
    try {
      const res = await api.get<UserDashboardEventDetail>(
        `/dashboard/user/events/${eventId}?username=${encodeURIComponent(user.username)}`,
        token
      );
      setData(res);
    } catch (error) {
      logBackgroundError(error, 'FetchEventDetail');
    }
  }, [eventId, token, user?.username]);

  useEffect(() => {
    setIsLoading(true);
    fetchDetail().finally(() => setIsLoading(false));
  }, [fetchDetail]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDetail();
    setRefreshing(false);
  }, [fetchDetail]);

  if (isLoading || !eventId) {
    return <LoadingScreen showLogo={false} />;
  }

  if (!data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Icon name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Detail události</Text>
        </View>
        <View style={styles.errorBox}>
          <Text style={[styles.errorText, { color: colors.textMuted }]}>
            Nepodařilo se načíst detail události.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { event, summary } = data;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {event.name}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            {formatDate(event.startDate)}
            {event.endDate ? ` → ${formatDate(event.endDate)}` : ''}
          </Text>
          {event.isActive && (
            <View style={[styles.activeBadge, { backgroundColor: colors.greenBg }]}>
              <Text style={[styles.activeBadgeText, { color: colors.green }]}>Aktivní</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{summary.userBeers}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Moje piva</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {summary.sharePercent.toFixed(1)}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Podíl</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{summary.totalEventBeers}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Celkem v události</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.galleryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() =>
            router.push({
              pathname: '/(app)/(tabs)/gallery',
              params: { eventId },
            } as { pathname: string; params: { eventId: string } })
          }
          activeOpacity={0.8}
        >
          <Icon name="image" size={22} color={colors.primary} />
          <Text style={[styles.galleryButtonText, { color: colors.text }]}>Galerie události</Text>
          <Text style={[styles.galleryArrow, { color: colors.textMuted }]}>→</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, marginLeft: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', marginHorizontal: 8 },
  headerRight: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  card: { borderRadius: 12, padding: 16, marginBottom: 16 },
  dateText: { fontSize: 15 },
  activeBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginTop: 12 },
  activeBadgeText: { fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 4 },
  errorBox: { padding: 24, alignItems: 'center' },
  errorText: { fontSize: 15 },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  galleryButtonText: { flex: 1, fontSize: 16, fontWeight: '600' },
  galleryArrow: { fontSize: 18 },
});
