import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  getNotificationTypeDescriptor,
  getAllNotificationTypes,
  type NotificationRecipientContext,
} from './notification-type.registry';
import { NotificationsGateway } from './notifications.gateway';
import type { Notification, Prisma } from '@prisma/client';

export interface NotificationListParams {
  limit?: number;
  cursor?: string;
}

export interface NotificationListResult {
  items: Notification[];
  nextCursor: string | null;
}

export interface NotificationPreferenceDto {
  type: string;
  enabled: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  private getContext(): NotificationRecipientContext {
    return {
      getEventParticipantIds: async (eventId: string) => {
        const rows = await this.prisma.eventUsers.findMany({
          where: { eventId },
          select: { userId: true },
        });
        return rows.map((r) => r.userId);
      },
    };
  }

  private async isTypeEnabledForUser(userId: string, type: string): Promise<boolean> {
    const pref = await this.prisma.notificationPreference.findUnique({
      where: { userId_type: { userId, type } },
    });
    return pref === null ? true : pref.enabled;
  }

  /**
   * Create notifications for all recipients and emit via WebSocket.
   */
  async notify(
    type: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const descriptor = getNotificationTypeDescriptor(type);
    if (!descriptor) {
      this.logger.warn(`Unknown notification type: ${type}`);
      return;
    }

    const context = this.getContext();
    let userIds: string[];
    try {
      userIds = await descriptor.getRecipients(payload, context);
    } catch (err) {
      this.logger.warn(`getRecipients failed for type ${type}`, err);
      return;
    }

    const enabledUserIds: string[] = [];
    for (const uid of userIds) {
      const enabled = await this.isTypeEnabledForUser(uid, type);
      if (enabled) enabledUserIds.push(uid);
    }

    if (enabledUserIds.length === 0) return;

    let enrichedPayload = { ...payload };
    if (
      (type === 'BEER_ADDED' || type === 'BEER_REMOVED') &&
      payload.actorUserId &&
      typeof payload.actorUserId === 'string'
    ) {
      const actor = await this.prisma.user.findUnique({
        where: { id: payload.actorUserId },
        select: { username: true, name: true },
      });
      enrichedPayload = {
        ...payload,
        actorName: actor?.username ?? actor?.name ?? 'Někdo',
      };
    }

    const notifications = await this.prisma.notification.createManyAndReturn({
      data: enabledUserIds.map((userId) => ({
        userId,
        type,
        payload: enrichedPayload as Prisma.InputJsonValue,
        readAt: null,
      })),
    });

    for (const notification of notifications) {
      this.notificationsGateway.emitNewNotification(notification);
    }
  }

  async findForUser(
    userId: string,
    params: NotificationListParams = {},
  ): Promise<NotificationListResult> {
    const limit = Math.min(params.limit ?? 20, 100);
    const cursor = params.cursor
      ? { id: params.cursor }
      : undefined;

    const items = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: params.cursor! } : undefined,
    });

    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? resultItems[resultItems.length - 1].id : null;

    return { items: resultItems, nextCursor };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  async markRead(id: string, userId: string): Promise<Notification | null> {
    const updated = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
    if (updated.count === 0) return null;
    return this.prisma.notification.findUnique({
      where: { id },
    });
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return result.count;
  }

  async getPreferences(userId: string): Promise<NotificationPreferenceDto[]> {
    const types = getAllNotificationTypes();
    const rows = await this.prisma.notificationPreference.findMany({
      where: { userId, type: { in: types } },
    });
    const map = new Map(rows.map((r) => [r.type, r.enabled]));
    return types.map((type) => ({
      type,
      enabled: map.get(type) ?? true,
    }));
  }

  async updatePreferences(
    userId: string,
    updates: Record<string, boolean>,
  ): Promise<NotificationPreferenceDto[]> {
    for (const [type, enabled] of Object.entries(updates)) {
      await this.prisma.notificationPreference.upsert({
        where: { userId_type: { userId, type } },
        create: { userId, type, enabled },
        update: { enabled },
      });
    }
    return this.getPreferences(userId);
  }
}
