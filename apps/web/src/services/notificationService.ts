import { api } from './api';

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsListResponse {
  items: NotificationItem[];
  nextCursor: string | null;
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationPreferenceItem {
  type: string;
  enabled: boolean;
}

export const notificationService = {
  getList(params?: { limit?: number; cursor?: string }): Promise<NotificationsListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params?.cursor) searchParams.set('cursor', params.cursor);
    const qs = searchParams.toString();
    return api.get<NotificationsListResponse>(`/notifications${qs ? `?${qs}` : ''}`).then((r) => r.data);
  },

  getUnreadCount(): Promise<number> {
    return api.get<UnreadCountResponse>('/notifications/unread-count').then((r) => r.data.count);
  },

  markRead(id: string): Promise<unknown> {
    return api.patch(`/notifications/${id}/read`).then((r) => r.data);
  },

  markAllRead(): Promise<{ count: number }> {
    return api.patch<{ count: number }>('/notifications/read').then((r) => r.data);
  },

  getPreferences(): Promise<NotificationPreferenceItem[]> {
    return api.get<NotificationPreferenceItem[]>('/notifications/preferences').then((r) => r.data);
  },

  updatePreferences(updates: Record<string, boolean>): Promise<NotificationPreferenceItem[]> {
    return api
      .patch<NotificationPreferenceItem[]>('/notifications/preferences', { preferences: updates })
      .then((r) => r.data);
  },
};
