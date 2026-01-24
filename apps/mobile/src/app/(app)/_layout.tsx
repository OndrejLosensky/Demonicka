import { useEffect } from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { useEventStore } from '../../store/event.store';
import { websocketService } from '../../services/websocket.service';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

export default function AppLayout() {
  const { isAuthenticated, isLoading, token } = useAuthStore();
  const fetchActiveEvent = useEventStore((state) => state.fetchActiveEvent);
  const activeEvent = useEventStore((state) => state.activeEvent);

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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="participants" />
      <Stack.Screen name="barrels" />
      <Stack.Screen name="system" />
    </Stack>
  );
}
