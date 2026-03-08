import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UserRole } from '@prisma/client';
import type { Notification } from '@prisma/client';

export interface NotificationPayload {
  id: string;
  userId: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
}

@WebSocketGateway({
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      /^http:\/\/localhost:[0-9]+$/,
      /^http:\/\/10\.[0-9]+\.[0-9]+\.[0-9]+:[0-9]+$/,
      /^http:\/\/100\.96\.[0-9]+\.[0-9]+\.[0-9]+:[0-9]+$/,
      /^http:\/\/192\.168\.[0-9]+\.[0-9]+:[0-9]+$/,
    ],
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  handleConnection(client: Socket): void {
    const token =
      (client.handshake.auth?.token as string) ||
      (client.handshake.headers?.authorization?.replace(
        /^Bearer\s+/i,
        '',
      ) as string);
    if (!token) {
      return;
    }
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      return;
    }
    try {
      const payload = this.jwtService.verify<{
        sub?: string;
        username?: string;
      }>(token);
      const username = payload.username;
      if (!username) {
        return;
      }
      this.usersService
        .findByUsername(username)
        .then((user) => {
          if (!user || user.deletedAt || !user.canLogin) {
            return;
          }
          (client as Socket & { userId?: string; userRole?: UserRole }).userId =
            user.id;
          (client as Socket & { userId?: string; userRole?: UserRole }).userRole =
            user.role;
          void client.join(`user:${user.id}`);
        })
        .catch(() => {
          // ignore invalid user
        });
    } catch {
      // invalid or expired token
    }
  }

  handleDisconnect(_client: Socket): void {
    // nothing to clean up per client
  }

  emitNewNotification(notification: Notification): void {
    try {
      const payload: NotificationPayload = {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        payload: notification.payload as Record<string, unknown>,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
      };
      this.server
        .to(`user:${notification.userId}`)
        .emit('notification:new', payload);
    } catch (err) {
      this.logger.warn('emitNewNotification failed', err);
    }
  }
}
