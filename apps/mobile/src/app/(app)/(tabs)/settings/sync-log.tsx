import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../../../components/layout/Header';
import { offlineSync, type SyncLogEntry } from '../../../../services/offlineSync';
import { useSyncStatus } from '../../../../hooks/useSyncStatus';

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function logKindLabel(kind: SyncLogEntry['kind']): string {
  switch (kind) {
    case 'queued':
      return 'Přidáno do fronty';
    case 'sync_start':
      return 'Synchronizace zahájena';
    case 'sync_item_ok':
      return 'Odesláno';
    case 'sync_item_fail':
      return 'Chyba';
    case 'sync_done':
      return 'Synchronizace dokončena';
    default:
      return kind;
  }
}

export default function SyncLogScreen() {
  const { queueLength, statusLabel, runSync } = useSyncStatus();
  const [entries, setEntries] = useState<SyncLogEntry[]>(() => offlineSync.getLogEntries());

  const refresh = useCallback(() => {
    setEntries(offlineSync.getLogEntries());
  }, []);

  const handleSync = useCallback(async () => {
    await runSync();
    refresh();
  }, [runSync, refresh]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Sync log" showBack />

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          Stav: {statusLabel} {queueLength > 0 ? `(${queueLength} v frontě)` : ''}
        </Text>
        {queueLength > 0 && (
          <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
            <Text style={styles.syncButtonText}>Synchronizovat</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        onRefresh={refresh}
        refreshing={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.entry}>
            <Text style={styles.entryTime}>{formatTime(item.at)}</Text>
            <Text style={styles.entryKind}>{logKindLabel(item.kind)}</Text>
            {item.path != null && (
              <Text style={styles.entryPath} numberOfLines={2}>
                {item.method ?? ''} {item.path}
              </Text>
            )}
            {item.message != null && (
              <Text style={styles.entryMessage} numberOfLines={2}>
                {item.message}
              </Text>
            )}
            {item.queueLength != null && (
              <Text style={styles.entryMeta}>Fronta: {item.queueLength}</Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Žádné záznamy</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statusText: { fontSize: 14, color: '#374151' },
  syncButton: { backgroundColor: '#FF0000', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  syncButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  list: { padding: 16, paddingBottom: 32 },
  entry: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#d1d5db',
  },
  entryTime: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  entryKind: { fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 2 },
  entryPath: { fontSize: 12, color: '#374151', fontFamily: 'monospace', marginBottom: 2 },
  entryMessage: { fontSize: 12, color: '#dc2626', marginBottom: 2 },
  entryMeta: { fontSize: 11, color: '#9ca3af' },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#6b7280' },
});