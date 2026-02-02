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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActiveEvent } from '../../../hooks/useActiveEvent';
import { useAuthStore } from '../../../store/auth.store';
import { api } from '../../../services/api';
import { Icon } from '../../../components/icons';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../components/ui/EmptyState';
import type { User } from '@demonicka/shared-types';

export default function ParticipantsScreen() {
  const { activeEvent, isLoading: eventLoading } = useActiveEvent();
  const token = useAuthStore((state) => state.token);

  const [participants, setParticipants] = useState<User[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchParticipants = useCallback(async () => {
    if (!activeEvent?.id || !token) return;

    try {
      const data = await api.get<User[]>(
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

  const renderParticipant = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.participantCard} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(item.name || item.username || '?').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.participantInfo}>
        <Text style={styles.participantName}>{item.name || item.username}</Text>
        <Text style={styles.participantMeta}>
          {item.beerCount} piv • {item.role}
        </Text>
      </View>
      <View style={styles.beerCountWrap}>
        <Icon name="beer" size={16} color="#FF0000" />
        <Text style={styles.beerCount}>{item.beerCount}</Text>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.title}>Účastníci</Text>
        <Text style={styles.subtitle}>
          {participants.length} účastníků
        </Text>
      </View>

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
});
