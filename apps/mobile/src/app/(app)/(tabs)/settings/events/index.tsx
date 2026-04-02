import { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRole } from '../../../../../hooks/useRole';
import { useThemeColors } from '../../../../../hooks/useThemeColors';
import { useAuthStore } from '../../../../../store/auth.store';
import { useEventStore } from '../../../../../store/event.store';
import { api } from '../../../../../services/api';
import { logBackgroundError } from '../../../../../utils/errorHandler';
import { Header } from '../../../../../components/layout/Header';
import { LoadingScreen } from '../../../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../../../components/ui/EmptyState';
import { CreateEventModal } from '../../../../../components/events/CreateEventModal';
import type { CreateEventConfig } from '../../../../../components/events/CreateEventModal';
import { Icon } from '../../../../../components/icons';
import { formatDate } from '../../../../../utils/format';
import { Permission } from '@demonicka/shared';
import type { Event } from '@demonicka/shared-types';
import type { CreateEventDto } from '@demonicka/shared-types';

export default function EventListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const token = useAuthStore((state) => state.token);
  const refetchActiveEvent = useEventStore((state) => state.fetchActiveEvent);
  const { isOperator, hasPermission } = useRole();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const canCreateEvent = hasPermission(Permission.CREATE_EVENT);

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    try {
      const list = await api.get<Event[]>('/events', token);
      setEvents(list ?? []);
    } catch (e) {
      logBackgroundError(e, 'FetchEvents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOperator) fetchEvents();
  }, [isOperator, fetchEvents]);

  const handleCreateEvent = useCallback(
    async (data: CreateEventDto, config: CreateEventConfig) => {
      if (!token) return;
      const created = await api.post<Event>('/events', data, token);
      const hasNonDefault =
        config.beerPongEnabled !== false ||
        config.beerSizesEnabled !== false ||
        config.beerPrice !== 30;
      if (hasNonDefault && created?.id) {
        await api.put(`/events/${created.id}`, config, token);
      }
      await Promise.all([fetchEvents(), refetchActiveEvent()]);
      setCreateModalVisible(false);
    },
    [token, fetchEvents, refetchActiveEvent]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        listContent: { padding: 12, paddingBottom: 24 },
        card: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.card,
          borderRadius: 10,
          padding: 12,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: colors.cardBorder,
        },
        cardName: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text, marginRight: 8 },
        cardRight: { flexDirection: 'row' as const, alignItems: 'center', flexShrink: 0 },
        cardDate: { fontSize: 13, color: colors.textSecondary, marginRight: 6 },
        activeBadge: { backgroundColor: colors.greenBg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 },
        activeBadgeText: { fontSize: 11, fontWeight: '600', color: colors.green },
        cardArrow: { fontSize: 14, color: colors.textMuted },
      }),
    [colors]
  );

  if (!isOperator) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Události" showBack />
        <EmptyState
          icon={<Icon name="lock" size={48} color={colors.textMuted} />}
          title="Přístup odepřen"
          message="Nemáte oprávnění."
        />
      </SafeAreaView>
    );
  }

  if (loading) return <LoadingScreen showLogo={false} />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Události"
        showBack
        rightAction={
          canCreateEvent
            ? { label: 'Přidat', onPress: () => setCreateModalVisible(true) }
            : undefined
        }
      />
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEvents(); }} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Icon name="calendar" size={48} color={colors.textMuted} />}
            title="Žádné události"
            message="Nemáte přístup k žádné události."
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(app)/(tabs)/settings/events/${item.id}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.cardRight}>
              <Text style={styles.cardDate}>{formatDate(item.startDate)}</Text>
              {item.isActive && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Aktivní</Text>
                </View>
              )}
              <Text style={styles.cardArrow}>→</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <CreateEventModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={handleCreateEvent}
      />
    </SafeAreaView>
  );
}
