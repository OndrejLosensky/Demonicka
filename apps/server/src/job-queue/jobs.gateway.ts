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
import { JobStatus } from '@prisma/client';

export interface JobUpdatePayload {
  jobId: string;
  type: string;
  status: JobStatus;
  result?: Record<string, unknown> | null;
  error?: string | null;
  createdByUserId?: string | null;
}

@WebSocketGateway({
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      /^http:\/\/localhost:[0-9]+$/,
      /^http:\/\/10\.[0-9]+\.[0-9]+\.[0-9]+:[0-9]+$/,
      /^http:\/\/100\.96\.[0-9]+\.[0-9]+:[0-9]+$/,
      /^http:\/\/192\.168\.[0-9]+\.[0-9]+:[0-9]+$/,
    ],
    credentials: true,
  },
})
export class JobsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(JobsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  handleConnection(client: Socket): void {
    const token =
      (client.handshake.auth?.token as string) ||
      (client.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '') as string);
    if (!token) {
      return;
    }
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      return;
    }
    try {
      const payload = this.jwtService.verify<{ sub?: string; username?: string }>(token);
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
          (client as Socket & { userId?: string; userRole?: UserRole }).userId = user.id;
          (client as Socket & { userId?: string; userRole?: UserRole }).userRole = user.role;
          void client.join(`user:${user.id}`);
          if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.OPERATOR) {
            void client.join('jobs:admin');
          }
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

  emitJobUpdate(payload: JobUpdatePayload): void {
    try {
      const eventPayload = {
        jobId: payload.jobId,
        type: payload.type,
        status: payload.status,
        result: payload.result ?? null,
        error: payload.error ?? null,
      };
      if (payload.createdByUserId) {
        this.server.to(`user:${payload.createdByUserId}`).emit('job:updated', eventPayload);
      }
      this.server.to('jobs:admin').emit('job:updated', eventPayload);
    } catch (err) {
      this.logger.warn('emitJobUpdate failed', err);
    }
  }
}
