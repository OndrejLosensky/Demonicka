import { useEffect } from 'react';
import { useEventStore } from '../store/event.store';
import { useAuthStore } from '../store/auth.store';

export function useActiveEvent() {
  const activeEvent = useEventStore((state) => state.activeEvent);
  const isLoading = useEventStore((state) => state.isLoading);
  const error = useEventStore((state) => state.error);
  const fetchActiveEvent = useEventStore((state) => state.fetchActiveEvent);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated && !activeEvent && !isLoading) {
      fetchActiveEvent();
    }
  }, [isAuthenticated, activeEvent, isLoading, fetchActiveEvent]);

  return {
    activeEvent,
    isLoading,
    error,
    refetch: fetchActiveEvent,
  };
}
