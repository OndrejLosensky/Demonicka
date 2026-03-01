import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { useEventStore } from '../../store/event.store';
import { websocketService } from '../../services/websocket.service';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { useSyncStatus } from '../../hooks/useSyncStatus';

export default function AppLayout() {
  const { isAuthenticated, isLoading, token } = useAuthStore();
  const fetchActiveEvent = useEventStore((state) => state.fetchActiveEvent);
  const activeEvent = useEventStore((state) => state.activeEvent);
  const { statusLabel, status } = useSyncStatus();

  // Fetch active event when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchActiveEvent();
    }
  }, [isAuthenticated, fetchActiveEvent]);

  // Connect to WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      websocketService.connect(token);

      return () => {
        websocketService.disconnect();
      };
    }
  }, [isAuthenticated, token]);

  // Join event room when active event changes
  useEffect(() => {
    if (activeEvent?.id) {
      websocketService.joinEvent(activeEvent.id);
    }
  }, [activeEvent?.id]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={styles.container}>
      {(status === 'pending' || status === 'syncing') && (
        <View style={styles.syncBar}>
          <Text style={styles.syncText}>{statusLabel}</Text>
        </View>
      )}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="leaderboard" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  syncBar: {
    backgroundColor: '#fef3c7',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  syncText: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
  },
});
