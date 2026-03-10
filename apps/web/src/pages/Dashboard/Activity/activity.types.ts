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
  | 'USER_CREATED'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'ADMIN_LOGIN_FAILED'
  | 'LOGIN_2FA_SEND_FAILED'
  | 'LOGIN_2FA_INVALID'
  | 'ADMIN_LOGIN_2FA_SEND_FAILED'
  | 'ADMIN_LOGIN_2FA_INVALID'
  | 'REGISTRATION_FAILED'
  | 'COMPLETE_REGISTRATION_FAILED'
  | 'AUTH_TOKEN_INVALID'
  | 'USER_CREATE_FAILED'
  | 'REFRESH_TOKEN_INVALID'
  | 'GOOGLE_LOGIN_FAILED'
  | 'BEER_ADD_FAILED'
  | 'BEER_REMOVE_FAILED'
  | 'BARREL_CREATE_FAILED'
  | 'BARREL_UPDATE_FAILED'
  | 'BARREL_SET_ACTIVE_FAILED'
  | 'BARREL_DELETE_FAILED'
  | 'PROFILE_PICTURE_UPLOAD_FAILED'
  | 'EVENT_UPDATE_FAILED'
  | 'GALLERY_PHOTO_UPLOAD_FAILED'
  | 'GALLERY_PHOTO_DELETE_FAILED';

export interface ActivityUserRef {
  id: string;
  username: string | null;
  name: string | null;
}

export type ActivityAppSource = 'backend' | 'web' | 'mobile';
export type ActivityLogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

export interface ActivityLogEntry {
  timestamp: string;
  level: string;
  message: string;
  app?: ActivityAppSource;
  /** @deprecated use app */
  service?: string;
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
  jobId?: string;
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

