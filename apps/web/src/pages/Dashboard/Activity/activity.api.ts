import { api } from '../../../services/api';
import type { ActivityEventType, ActivityLogsResponse } from './activity.types';
import { ACTIVITY_EVENTS } from './activity.constants';

export async function fetchActivityLogs(params: {
  limit: number;
  offset: number;
  eventType?: ActivityEventType | '';
  startDate?: string;
  endDate?: string;
  search?: string;
  level?: string;
}): Promise<ActivityLogsResponse> {
  const qs = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });

  if (params.startDate) qs.append('startDate', params.startDate);
  if (params.endDate) qs.append('endDate', params.endDate);
  if (params.search) qs.append('search', params.search);
  if (params.level) qs.append('level', params.level);

  if (params.eventType) {
    qs.append('eventType', params.eventType);
  } else {
    ACTIVITY_EVENTS.forEach((e) => qs.append('eventType', e));
  }

  const response = await api.get<ActivityLogsResponse>(`/logs?${qs}`);
  return response.data;
}

