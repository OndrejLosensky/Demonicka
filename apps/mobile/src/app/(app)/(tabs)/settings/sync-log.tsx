import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../../../components/layout/Header';
import { offlineSync, type SyncLogEntry } from '../../../../services/offlineSync';
import { useSyncStatus } from '../../../../hooks/useSyncStatus';
import { useThemeColors } from '../../../../hooks/useThemeColors';

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
  const colors = useThemeColors();
  const [entries, setEntries] = useState<SyncLogEntry[]>(() => offlineSync.getLogEntries());

  const refresh = useCallback(() => {
    setEntries(offlineSync.getLogEntries());
  }, []);

  const handleSync = useCallback(async () => {
    await runSync();
    refresh();
  }, [runSync, refresh]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <Header title="Sync log" showBack />

      <View style={[styles.statusBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.statusText, { color: colors.text }]}>
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
          <View style={[styles.entry, { backgroundColor: colors.card, borderLeftColor: colors.border }]}>
            <Text style={[styles.entryTime, { color: colors.textMuted }]}>{formatTime(item.at)}</Text>
            <Text style={[styles.entryKind, { color: colors.text }]}>{logKindLabel(item.kind)}</Text>
            {item.path != null && (
              <Text style={[styles.entryPath, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.method ?? ''} {item.path}
              </Text>
            )}
            {item.message != null && (
              <Text style={[styles.entryMessage, { color: colors.red }]} numberOfLines={2}>
                {item.message}
              </Text>
            )}
            {item.queueLength != null && (
              <Text style={[styles.entryMeta, { color: colors.textMuted }]}>Fronta: {item.queueLength}</Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Žádné záznamy</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
  },
  statusText: { fontSize: 14 },
  syncButton: { backgroundColor: '#FF0000', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  syncButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  list: { padding: 16, paddingBottom: 32 },
  entry: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  entryTime: { fontSize: 12, marginBottom: 2 },
  entryKind: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  entryPath: { fontSize: 12, fontFamily: 'monospace', marginBottom: 2 },
  entryMessage: { fontSize: 12, marginBottom: 2 },
  entryMeta: { fontSize: 11 },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 15 },
});