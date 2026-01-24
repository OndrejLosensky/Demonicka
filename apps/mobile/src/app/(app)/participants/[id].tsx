import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../store/auth.store';
import { useActiveEvent } from '../../../hooks/useActiveEvent';
import { api } from '../../../services/api';
import { Header } from '../../../components/layout/Header';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { ErrorView } from '../../../components/ui/ErrorView';
import { StatCard } from '../../../components/cards/StatCard';
import { formatRelativeTime } from '../../../utils/format';
import type { User } from '@demonicka/shared-types';

export default function ParticipantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((state) => state.token);
  const { activeEvent } = useActiveEvent();

  const [participant, setParticipant] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipant = useCallback(async () => {
    if (!activeEvent?.id || !token || !id) return;

    try {
      setError(null);
      const data = await api.get<User>(
        `/events/${activeEvent.id}/participants/${id}`,
        token
      );
      setParticipant(data);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err?.message ?? 'Nepodařilo se načíst účastníka');
    }
  }, [activeEvent?.id, token, id]);

  useEffect(() => {
    setIsLoading(true);
    fetchParticipant().finally(() => setIsLoading(false));
  }, [fetchParticipant]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchParticipant();
    setRefreshing(false);
  }, [fetchParticipant]);

  if (isLoading) {
    return <LoadingScreen showLogo={false} />;
  }

  if (error || !participant) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Účastník" showBack />
        <ErrorView message={error ?? 'Účastník nenalezen'} onRetry={fetchParticipant} />
      </SafeAreaView>
    );
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'OPERATOR':
        return 'Operátor';
      case 'USER':
        return 'Uživatel';
      case 'PARTICIPANT':
        return 'Účastník';
      default:
        return role;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Detail účastníka" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF0000" />
        }
      >
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(participant.name || participant.username || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{participant.name || participant.username}</Text>
          <Text style={styles.username}>@{participant.username}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{getRoleLabel(participant.role)}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            icon="🍺"
            label="Počet piv"
            value={participant.beerCount}
            style={styles.statCard}
          />
          <StatCard
            icon="⏱️"
            label="Poslední pivo"
            value={participant.lastBeerTime ? formatRelativeTime(participant.lastBeerTime) : '-'}
            color="#3b82f6"
            style={styles.statCard}
          />
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Podrobnosti</Text>
          <View style={styles.detailsCard}>
            {participant.firstName && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Jméno</Text>
                <Text style={styles.detailValue}>{participant.firstName}</Text>
              </View>
            )}
            {participant.lastName && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Příjmení</Text>
                <Text style={styles.detailValue}>{participant.lastName}</Text>
              </View>
            )}
            {participant.email && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{participant.email}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pohlaví</Text>
              <Text style={styles.detailValue}>
                {participant.gender === 'MALE' ? 'Muž' : 'Žena'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailLabel: {
    fontSize: 15,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111',
  },
});
