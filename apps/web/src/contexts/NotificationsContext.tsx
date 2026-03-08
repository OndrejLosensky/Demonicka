import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { notificationService, type NotificationItem } from '../services/notificationService';
import { websocketService } from '../services/websocketService';
import type { NotificationPayload } from '../services/websocketService';

export interface NotificationsContextValue {
  unreadCount: number;
  notifications: NotificationItem[];
  loadingCount: boolean;
  loadingList: boolean;
  refetchCount: () => Promise<void>;
  refetchList: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingCount, setLoadingCount] = useState(true);
  const [loadingList, setLoadingList] = useState(false);

  const refetchCount = useCallback(async () => {
    try {
      setLoadingCount(true);
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // ignore
    } finally {
      setLoadingCount(false);
    }
  }, []);

  const refetchList = useCallback(async () => {
    try {
      setLoadingList(true);
      const data = await notificationService.getList({ limit: 20 });
      setNotifications(data.items);
    } catch {
      // ignore
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void refetchCount();
  }, [refetchCount]);

  useEffect(() => {
    const handler = (payload: NotificationPayload) => {
      setUnreadCount((c) => c + 1);
      setNotifications((prev) => {
        if (prev.some((n) => n.id === payload.id)) return prev;
        return [
          {
            id: payload.id,
            userId: payload.userId,
            type: payload.type,
            payload: payload.payload,
            readAt: payload.readAt,
            createdAt: payload.createdAt,
          },
          ...prev,
        ];
      });
      void refetchCount();
    };
    websocketService.subscribe('notification:new', handler);
    return () => websocketService.unsubscribe('notification:new', handler);
  }, [refetchCount]);

  const markRead = useCallback(async (id: string) => {
    await notificationService.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    await refetchCount();
  }, [refetchCount]);

  const markAllRead = useCallback(async () => {
    await notificationService.markAllRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
    );
    setUnreadCount(0);
  }, []);

  const value: NotificationsContextValue = {
    unreadCount,
    notifications,
    loadingCount,
    loadingList,
    refetchCount,
    refetchList,
    markRead,
    markAllRead,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return ctx;
}
