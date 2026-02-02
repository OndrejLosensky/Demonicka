import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActiveEvent } from '../../../hooks/useActiveEvent';
import { Icon } from '../../../components/icons';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../components/ui/EmptyState';
import { StatCard } from '../../../components/cards/StatCard';
import { formatDate } from '../../../utils/format';
import { useState, useCallback } from 'react';

export default function EventScreen() {
  const { activeEvent, isLoading, refetch } = useActiveEvent();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
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

  const participantCount = activeEvent.users?.length ?? 0;
  const barrelCount = activeEvent.barrels?.length ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF0000" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>{activeEvent.name}</Text>
          {activeEvent.description && (
            <Text style={styles.description}>{activeEvent.description}</Text>
          )}
        </View>

        <View style={styles.dateSection}>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Začátek:</Text>
            <Text style={styles.dateValue}>{formatDate(activeEvent.startDate)}</Text>
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Konec:</Text>
            <Text style={styles.dateValue}>{formatDate(activeEvent.endDate)}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            icon={<Icon name="group" size={24} color="#3b82f6" />}
            label="Účastníků"
            value={participantCount}
            color="#3b82f6"
            style={styles.statCard}
          />
          <StatCard
            icon={<Icon name="barrel" size={24} color="#f59e0b" />}
            label="Sudů"
            value={barrelCount}
            color="#f59e0b"
            style={styles.statCard}
          />
        </View>

        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Stav:</Text>
            <View style={[styles.statusBadge, activeEvent.isActive && styles.statusActive]}>
              <Text style={[styles.statusText, activeEvent.isActive && styles.statusTextActive]}>
                {activeEvent.isActive ? 'Aktivní' : 'Neaktivní'}
              </Text>
            </View>
          </View>
          {activeEvent.registrationEnabled && (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Registrace:</Text>
              <View style={[styles.statusBadge, styles.statusActive]}>
                <Text style={[styles.statusText, styles.statusTextActive]}>Otevřená</Text>
              </View>
            </View>
          )}
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
  },
  dateSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dateLabel: {
    fontSize: 15,
    color: '#6b7280',
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
  },
  statusSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statusLabel: {
    fontSize: 15,
    color: '#6b7280',
  },
  statusBadge: {
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusActive: {
    backgroundColor: '#dcfce7',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  statusTextActive: {
    color: '#16a34a',
  },
});
