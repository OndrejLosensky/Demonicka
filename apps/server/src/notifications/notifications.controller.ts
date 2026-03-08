import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import type { User } from '@prisma/client';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@Versions('1')
@UseGuards(JwtAuthGuard, VersionGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(
    @CurrentUser() user: User,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const userId = user.id;
    const params = {
      limit: limit !== undefined ? parseInt(limit, 10) : undefined,
      cursor: cursor || undefined,
    };
    return this.notificationsService.findForUser(userId, params);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Patch('read')
  async markAllRead(@CurrentUser() user: User) {
    const count = await this.notificationsService.markAllRead(user.id);
    return { count };
  }

  @Patch(':id/read')
  async markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const notification = await this.notificationsService.markRead(id, user.id);
    return notification ?? { ok: false };
  }

  @Get('preferences')
  async getPreferences(@CurrentUser() user: User) {
    return this.notificationsService.getPreferences(user.id);
  }

  @Patch('preferences')
  async updatePreferences(
    @CurrentUser() user: User,
    @Body() body: { preferences?: Record<string, boolean>; type?: string; enabled?: boolean },
  ) {
    const updates: Record<string, boolean> = {};
    if (body.preferences && typeof body.preferences === 'object') {
      Object.assign(updates, body.preferences);
    }
    if (body.type !== undefined && body.enabled !== undefined) {
      updates[body.type] = body.enabled;
    }
    return this.notificationsService.updatePreferences(user.id, updates);
  }
}
