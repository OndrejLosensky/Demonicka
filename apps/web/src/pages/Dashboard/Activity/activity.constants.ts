import type { ActivityEventType } from './activity.types';

export const ACTIVITY_EVENTS: readonly ActivityEventType[] = [
  'EVENT_CREATED',
  'EVENT_SET_ACTIVE',
  'PARTICIPANT_ADDED',
  'BARREL_ADDED',
  'BEER_ADDED',
  'BEER_REMOVED',
  'BEER_PONG_EVENT_CREATED',
  'BEER_PONG_TEAM_CREATED',
  'BEER_PONG_STARTED',
  'PARTICIPANT_REGISTERED',
  'SYSTEM_OPERATION_TRIGGERED',
  'SETTINGS_CHANGED',
  // legacy
  'USER_CREATED',
] as const;

