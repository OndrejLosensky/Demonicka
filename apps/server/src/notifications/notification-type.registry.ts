/**
 * Notification type registry: maps each type to getRecipients(payload, context) and messageKey.
 * Used by NotificationsService.notify() to resolve recipients and by UI for i18n.
 */

export const NOTIFICATION_TYPES = {
  BEER_ADDED: 'BEER_ADDED',
  BEER_REMOVED: 'BEER_REMOVED',
  EVENT_STARTED: 'EVENT_STARTED',
  EVENT_ENDED: 'EVENT_ENDED',
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

/** Context passed to getRecipients; implemented by NotificationsService. */
export interface NotificationRecipientContext {
  getEventParticipantIds(eventId: string): Promise<string[]>;
}

/** Payload shapes per type (TypeScript only; no runtime validation). */
export interface BeerAddedPayload {
  eventId: string;
  targetUserId: string;
  actorUserId?: string;
  actorName?: string;
}

export interface BeerRemovedPayload {
  eventId: string;
  targetUserId: string;
  actorUserId?: string;
  actorName?: string;
}

export interface EventStartedPayload {
  eventId: string;
  eventName?: string;
}

export interface EventEndedPayload {
  eventId: string;
  eventName?: string;
}

export type NotificationPayload =
  | BeerAddedPayload
  | BeerRemovedPayload
  | EventStartedPayload
  | EventEndedPayload;

export interface NotificationTypeDescriptor {
  getRecipients(
    payload: Record<string, unknown>,
    context: NotificationRecipientContext,
  ): Promise<string[]>;
  messageKey: string;
}

function beerRecipients(
  payload: Record<string, unknown>,
): Promise<string[]> {
  const target = payload.targetUserId;
  return Promise.resolve(
    target && typeof target === 'string' ? [target] : [],
  );
}

function eventRecipients(
  payload: Record<string, unknown>,
  context: NotificationRecipientContext,
): Promise<string[]> {
  const eventId = payload.eventId;
  if (typeof eventId !== 'string') return Promise.resolve([]);
  return context.getEventParticipantIds(eventId);
}

const registry = new Map<string, NotificationTypeDescriptor>([
  [
    NOTIFICATION_TYPES.BEER_ADDED,
    {
      getRecipients: beerRecipients,
      messageKey: 'BEER_ADDED',
    },
  ],
  [
    NOTIFICATION_TYPES.BEER_REMOVED,
    {
      getRecipients: beerRecipients,
      messageKey: 'BEER_REMOVED',
    },
  ],
  [
    NOTIFICATION_TYPES.EVENT_STARTED,
    {
      getRecipients: eventRecipients,
      messageKey: 'EVENT_STARTED',
    },
  ],
  [
    NOTIFICATION_TYPES.EVENT_ENDED,
    {
      getRecipients: eventRecipients,
      messageKey: 'EVENT_ENDED',
    },
  ],
]);

export function getNotificationTypeDescriptor(
  type: string,
): NotificationTypeDescriptor | undefined {
  return registry.get(type);
}

export function getAllNotificationTypes(): string[] {
  return Object.values(NOTIFICATION_TYPES);
}
