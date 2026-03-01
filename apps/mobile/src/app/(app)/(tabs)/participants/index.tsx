import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActiveEvent } from '../../../../hooks/useActiveEvent';
import { useAuthStore } from '../../../../store/auth.store';
import { api } from '../../../../services/api';
import { Icon } from '../../../../components/icons';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { AddParticipantModal } from '../../../../components/participants/AddParticipantModal';
import type { User } from '@demonicka/shared-types';

type EventUser = User & { eventBeerCount?: number };

type Gender = 'MALE' | 'FEMALE';

export default function ParticipantsScreen() {
  const router = useRouter();
  const { activeEvent, isLoading: eventLoading } = useActiveEvent();
  const token = useAuthStore((state) => state.token);

  const [participants, setParticipants] = useState<EventUser[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<EventUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [smallBeerForUser, setSmallBeerForUser] = useState<Record<string, boolean>>({});

  const fetchParticipants = useCallback(async () => {
    if (!activeEvent?.id || !token) return;

    try {
      const data = await api.get<EventUser[]>(
        `/events/${activeEvent.id}/users`,
        token
      );
      setParticipants(data);
      setFilteredParticipants(data);
    } catch (error) {
      console.error('Failed to fetch participants:', error);
    }
  }, [activeEvent?.id, token]);

  useEffect(() => {
    if (activeEvent?.id) {
      setIsLoading(true);
      fetchParticipants().finally(() => setIsLoading(false));
    }
  }, [activeEvent?.id, fetchParticipants]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredParticipants(participants);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredParticipants(
        participants.filter(
          (p) =>
            p.name?.toLowerCase().includes(query) ||
            p.username?.toLowerCase().includes(query) ||
            p.firstName?.toLowerCase().includes(query) ||
            p.lastName?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, participants]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchParticipants();
    setRefreshing(false);
  }, [fetchParticipants]);

  const handleAddParticipant = useCallback(
    async (username: string, gender: Gender) => {
      if (!token || !activeEvent?.id) return;
      const user = await api.post<EventUser>(
        '/users/participant',
        { username, gender },
        token
      );
      await api.put(`/events/${activeEvent.id}/users/${user.id}`, {}, token);
      await fetchParticipants();
    },
    [token, activeEvent?.id, fetchParticipants]
  );

  const handleAddBeer = useCallback(
    async (userId: string) => {
      if (!token || !activeEvent?.id) return;
      const useSmall = activeEvent.beerSizesEnabled !== false && smallBeerForUser[userId];
      await api.post(
        `/events/${activeEvent.id}/users/${userId}/beers`,
        useSmall ? { beerSize: 'SMALL' } : {},
        token
      );
      await fetchParticipants();
    },
    [token, activeEvent?.id, activeEvent?.beerSizesEnabled, smallBeerForUser, fetchParticipants]
  );

  const handleRemoveBeer = useCallback(
    async (userId: string) => {
      if (!token || !activeEvent?.id) return;
      await api.delete(`/events/${activeEvent.id}/users/${userId}/beers`, token);
      await fetchParticipants();
    },
    [token, activeEvent?.id, fetchParticipants]
  );

  const handleAddSpilledBeer = useCallback(
    async (userId: string) => {
      if (!token || !activeEvent?.id) return;
      await api.post(
        `/events/${activeEvent.id}/users/${userId}/beers`,
        { spilled: true },
        token
      );
      await fetchParticipants();
    },
    [token, activeEvent?.id, fetchParticipants]
  );

  const toggleSmallBeer = useCallback((userId: string) => {
    setSmallBeerForUser((prev) => ({ ...prev, [userId]: !prev[userId] }));
  }, []);

  const renderParticipant = ({ item }: { item: EventUser }) => {
    const beerCount = item.eventBeerCount ?? 0;
    const isSmall = smallBeerForUser[item.id];
    const beerSizesEnabled = activeEvent?.beerSizesEnabled !== false;
    return (
      <View style={styles.participantCard}>
        <TouchableOpacity
          style={styles.participantMain}
          activeOpacity={0.7}
          onPress={() => router.push(`/(app)/(tabs)/participants/${item.id}`)}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.name || item.username || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.participantInfo}>
            <Text style={styles.participantName}>{item.name || item.username}</Text>
            <Text style={styles.participantMeta}>{beerCount} piv</Text>
          </View>
          <View style={styles.beerCountWrap}>
            <Icon name="beer" size={16} color="#FF0000" />
            <Text style={styles.beerCount}>{beerCount}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleAddBeer(item.id)}
          >
            <Icon name="add" size={20} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleRemoveBeer(item.id)}
          >
            <Icon name="remove" size={20} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSpill]}
            onPress={() => handleAddSpilledBeer(item.id)}
          >
            <Icon name="spill" size={18} color="#b45309" />
          </TouchableOpacity>
          {beerSizesEnabled && (
          <TouchableOpacity
            style={[styles.sizeBtn, isSmall && styles.sizeBtnActive]}
            onPress={() => toggleSmallBeer(item.id)}
          >
            <Text style={[styles.sizeBtnText, isSmall && styles.sizeBtnTextActive]}>
              {isSmall ? 'S' : 'L'}
            </Text>
          </TouchableOpacity>
          )}
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Účastníci</Text>
          <Text style={styles.subtitle}>
            {participants.length} účastníků
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

      <AddParticipantModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSubmit={handleAddParticipant}
      />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Hledat účastníka..."
          placeholderTextColor="#9ca3af"
        />
      </View>

      <FlatList
        data={filteredParticipants}
        keyExtractor={(item) => item.id}
        renderItem={renderParticipant}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF0000" />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Icon name="group" size={48} color="#9ca3af" />}
            title="Žádní účastníci"
            message={
              searchQuery
                ? 'Žádný účastník neodpovídá hledání.'
                : 'Tato událost zatím nemá žádné účastníky.'
            }
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FF0000',
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 32,
    flexGrow: 1,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  participantMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
  },
  participantMeta: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  beerCountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  beerCount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF0000',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnSpill: {
    backgroundColor: '#fef3c7',
  },
  sizeBtn: {
    minWidth: 28,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  sizeBtnActive: {
    backgroundColor: '#FF0000',
  },
  sizeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
  },
  sizeBtnTextActive: {
    color: '#fff',
  },
});
