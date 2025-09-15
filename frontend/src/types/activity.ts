export interface ActivityLog {
  id: string;
  type: 'BEER_ADDED' | 'BEER_REMOVED' | 'USER_JOINED' | 'USER_LEFT' | 'EVENT_CREATED' | 'EVENT_UPDATED' | 'EVENT_DELETED';
  message: string;
  userId?: string;
  userName?: string;
  eventId?: string;
  eventName?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ActivityLogsResponse {
  data: ActivityLog[];
  total: number;
  page: number;
  limit: number;
}

export interface ActivityLogsParams {
  page?: number;
  limit?: number;
  type?: string;
  userId?: string;
  eventId?: string;
}
