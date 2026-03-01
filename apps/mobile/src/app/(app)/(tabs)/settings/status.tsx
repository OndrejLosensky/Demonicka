import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../../../components/layout/Header';
import { config } from '../../../../config';
import { useAuthStore } from '../../../../store/auth.store';
import { websocketService } from '../../../../services/websocket.service';

type Status = 'online' | 'offline' | 'checking';

function StatusRow({
  label,
  status,
}: {
  label: string;
  status: Status;
}) {
  const statusLabel =
    status === 'checking'
      ? 'Kontroluji…'
      : status === 'online'
        ? 'Online'
        : 'Offline';
  const statusColor = status === 'online' ? '#16a34a' : status === 'offline' ? '#dc2626' : '#6b7280';

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: statusColor }]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.status, { color: statusColor }]}>{statusLabel}</Text>
    </View>
  );
}

export default function StatusScreen() {
  const token = useAuthStore((state) => state.token);
  const [refreshing, setRefreshing] = useState(false);
  const [serverStatus, setServerStatus] = useState<Status>('checking');
  const [wsStatus, setWsStatus] = useState<Status>(() =>
    websocketService.isConnected ? 'online' : 'offline'
  );

  const checkServer = useCallback(async (): Promise<Status> => {
    if (!token) return 'offline';
    try {
      const res = await fetch(`${config.apiBaseUrl}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': '1',
          Authorization: `Bearer ${token}`,
        },
      });
      return res.ok || res.status === 401 ? 'online' : 'offline';
    } catch {
      return 'offline';
    }
  }, [token]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setServerStatus('checking');
    const server = await checkServer();
    setServerStatus(server);
    setWsStatus(websocketService.isConnected ? 'online' : 'offline');
    setRefreshing(false);
  }, [checkServer]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWsStatus(websocketService.isConnected ? 'online' : 'offline');
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Stav služeb" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#FF0000" />
        }
      >
        <View style={styles.card}>
          <StatusRow label="Server (API)" status={serverStatus} />
          <View style={styles.separator} />
          <StatusRow label="Aplikace" status="online" />
          <View style={styles.separator} />
          <StatusRow label="WebSocket" status={wsStatus} />
        </View>
        <Text style={styles.hint}>
          Server a WebSocket se kontrolují podle aktuálního připojení. Obnovení stránky znovu provede kontrolu.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  label: { flex: 1, fontSize: 16, color: '#111', fontWeight: '500' },
  status: { fontSize: 15, fontWeight: '500' },
  separator: { height: 1, backgroundColor: '#e5e7eb', marginLeft: 22 },
  hint: {
    marginTop: 16,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
});
