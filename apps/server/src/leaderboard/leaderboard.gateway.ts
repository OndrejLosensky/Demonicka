import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LeaderboardService } from './leaderboard.service';
import { DashboardService } from '../dashboard/dashboard.service';

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
export class LeaderboardGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly leaderboardService: LeaderboardService,
    private readonly dashboardService: DashboardService,
  ) {}

  handleConnection(client: Socket) {
    // Client connected
  }

  handleDisconnect(client: Socket) {
    // Client disconnected
  }

  // Allow clients to join/leave event rooms
  @SubscribeMessage('event:join')
  handleJoinEvent(client: Socket, payload: { eventId: string }) {
    const room = `event:${payload.eventId}`;
    void client.join(room);
  }

  @SubscribeMessage('event:leave')
  handleLeaveEvent(client: Socket, payload: { eventId: string }) {
    const room = `event:${payload.eventId}`;
    void client.leave(room);
  }

  // Method to emit leaderboard updates to all connected clients
  async emitLeaderboardUpdate(eventId?: string) {
    try {
      const leaderboard = await this.leaderboardService.getLeaderboard(eventId);
      if (eventId) {
        const room = `event:${eventId}`;
        this.server.to(room).emit('leaderboard:update', leaderboard);
        // legacy event name for any older clients
        this.server.to(room).emit('leaderboardUpdate', leaderboard);
      } else {
        this.server.emit('leaderboard:update', leaderboard);
        this.server.emit('leaderboardUpdate', leaderboard);
      }
    } catch (error) {
      console.error('Failed to emit leaderboard update:', error);
    }
  }

  // Method to emit dashboard stats updates to all connected clients
  async emitDashboardStatsUpdate(eventId?: string) {
    try {
      const dashboardStats =
        await this.dashboardService.getDashboardStats(eventId);
      const publicStats = await this.dashboardService.getPublicStats(eventId);

      if (eventId) {
        const room = `event:${eventId}`;

        this.server.to(room).emit('dashboard:stats:update', {
          dashboard: dashboardStats,
          public: publicStats,
        });
        // legacy event name for any older clients
        this.server.to(room).emit('dashboardStatsUpdate', {
          dashboard: dashboardStats,
          public: publicStats,
        });
      } else {
        this.server.emit('dashboard:stats:update', {
          dashboard: dashboardStats,
          public: publicStats,
        });
        this.server.emit('dashboardStatsUpdate', {
          dashboard: dashboardStats,
          public: publicStats,
        });
      }
    } catch (error) {
      console.error('Failed to emit dashboard stats update:', error);
    }
  }

  // Method to emit both leaderboard and dashboard updates
  async emitFullUpdate(eventId?: string) {
    try {
      // Emit dashboard stats first, then leaderboard to avoid race conditions
      await this.emitDashboardStatsUpdate(eventId);

      // Small delay to ensure dashboard stats are processed first
      await new Promise((resolve) => setTimeout(resolve, 100));

      await this.emitLeaderboardUpdate(eventId);
    } catch (error) {
      console.error('Failed to emit full update:', error);
    }
  }

  // Signal dashboards to refresh data (legacy method - now use emitDashboardStatsUpdate)
  async emitDashboardUpdate(eventId?: string) {
    try {
      if (eventId) {
        const room = `event:${eventId}`;
        await Promise.resolve(this.server.to(room).emit('dashboard:update'));
      } else {
        await Promise.resolve(this.server.emit('dashboard:update'));
      }
    } catch (error) {
      console.error('Failed to emit dashboard update:', error);
    }
  }
}
