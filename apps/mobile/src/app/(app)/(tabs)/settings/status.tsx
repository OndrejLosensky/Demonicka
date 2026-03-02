import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../../../components/layout/Header';
import { config } from '../../../../config';
import { useAuthStore } from '../../../../store/auth.store';
import { websocketService } from '../../../../services/websocket.service';
import { useThemeColors } from '../../../../hooks/useThemeColors';

type Status = 'online' | 'offline' | 'checking';

function StatusRow({
  label,
  status,
  colors,
}: {
  label: string;
  status: Status;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const statusLabel =
    status === 'checking'
      ? 'Kontroluji…'
      : status === 'online'
        ? 'Online'
        : 'Offline';
  const statusColor = status === 'online' ? colors.green : status === 'offline' ? colors.red : colors.textMuted;

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: statusColor }]} />
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.status, { color: statusColor }]}>{statusLabel}</Text>
    </View>
  );
}

export default function StatusScreen() {
  const token = useAuthStore((state) => state.token);
  const colors = useThemeColors();
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <Header title="Stav služeb" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <StatusRow label="Server (API)" status={serverStatus} colors={colors} />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <StatusRow label="Aplikace" status="online" colors={colors} />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <StatusRow label="WebSocket" status={wsStatus} colors={colors} />
        </View>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Server a WebSocket se kontrolují podle aktuálního připojení. Obnovení stránky znovu provede kontrolu.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
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
  label: { flex: 1, fontSize: 16, fontWeight: '500' },
  status: { fontSize: 15, fontWeight: '500' },
  separator: { height: 1, marginLeft: 22 },
  hint: {
    marginTop: 16,
    fontSize: 13,
    lineHeight: 18,
  },
});
