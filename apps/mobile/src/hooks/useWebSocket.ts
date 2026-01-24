import { useEffect, useCallback } from 'react';
import { websocketService } from '../services/websocket.service';

type EventCallback<T = unknown> = (data: T) => void;

/**
 * Hook to subscribe to WebSocket events
 */
export function useWebSocket<T = unknown>(
  event: string,
  callback: EventCallback<T>,
  enabled = true
): void {
  const memoizedCallback = useCallback(callback, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = websocketService.subscribe(event, (data) => {
      memoizedCallback(data as T);
    });

    return () => unsubscribe();
  }, [event, memoizedCallback, enabled]);
}

/**
 * Hook for leaderboard updates
 */
export function useLeaderboardUpdates<T = unknown>(callback: EventCallback<T>): void {
  useWebSocket('leaderboard:update', callback);
  // Also listen for legacy event
  useWebSocket('leaderboardUpdate', callback);
}

/**
 * Hook for dashboard stats updates
 */
export function useDashboardUpdates<T = unknown>(callback: EventCallback<T>): void {
  useWebSocket('dashboard:stats:update', callback);
  // Also listen for legacy event
  useWebSocket('dashboardStatsUpdate', callback);
}
