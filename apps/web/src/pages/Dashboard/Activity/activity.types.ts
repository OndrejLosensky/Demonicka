export type ActivityEventType =
  | 'EVENT_CREATED'
  | 'EVENT_SET_ACTIVE'
  | 'PARTICIPANT_ADDED'
  | 'BARREL_ADDED'
  | 'BEER_ADDED'
  | 'BEER_REMOVED'
  | 'BEER_PONG_EVENT_CREATED'
  | 'BEER_PONG_TEAM_CREATED'
  | 'BEER_PONG_STARTED'
  | 'PARTICIPANT_REGISTERED'
  | 'SYSTEM_OPERATION_TRIGGERED'
  | 'SETTINGS_CHANGED'
  | 'USER_CREATED';

export interface ActivityUserRef {
  id: string;
  username: string | null;
  name: string | null;
}

export interface ActivityLogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  event?: string;
  userId?: string;
  actorUserId?: string;
  user?: ActivityUserRef;
  actor?: ActivityUserRef;
  barrelId?: string;
  eventId?: string;
  eventName?: string;
  beerPongEventId?: string;
  teamId?: string;
  operation?: string;
  setting?: string;
  key?: string;
  name?: string;
  gender?: string;
  oldCount?: number;
  newCount?: number;
  size?: number;
  isActive?: boolean;
  changes?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ActivityLogsResponse {
  logs: ActivityLogEntry[];
  total: number;
}

