import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRole } from '../../../../../hooks/useRole';
import { useAuthStore } from '../../../../../store/auth.store';
import { api } from '../../../../../services/api';
import { Header } from '../../../../../components/layout/Header';
import { LoadingScreen } from '../../../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../../../components/ui/EmptyState';
import { Icon } from '../../../../../components/icons';
import { formatDate } from '../../../../../utils/format';
import type { Event } from '@demonicka/shared-types';

export default function EventListScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const { isOperator } = useRole();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    try {
      const list = await api.get<Event[]>('/events', token);
      setEvents(list ?? []);
    } catch (e) {
      console.error('Failed to fetch events:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOperator) fetchEvents();
  }, [isOperator, fetchEvents]);

  if (!isOperator) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Události" showBack />
        <EmptyState
          icon={<Icon name="lock" size={48} color="#9ca3af" />}
          title="Přístup odepřen"
          message="Nemáte oprávnění."
        />
      </SafeAreaView>
    );
  }

  if (loading) return <LoadingScreen showLogo={false} />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Události" showBack />
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEvents(); }} tintColor="#FF0000" />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Icon name="calendar" size={48} color="#9ca3af" />}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  listContent: { padding: 12, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111', marginRight: 8 },
  cardRight: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  cardDate: { fontSize: 13, color: '#6b7280', marginRight: 6 },
  activeBadge: { backgroundColor: '#dcfce7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 },
  activeBadgeText: { fontSize: 11, fontWeight: '600', color: '#16a34a' },
  cardArrow: { fontSize: 14, color: '#9ca3af' },
});
