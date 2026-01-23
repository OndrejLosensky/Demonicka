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
  ) {
    // Log when gateway is initialized
    console.log('[LeaderboardGateway] Initialized');
  }

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
      // Use dashboard service for consistency with frontend and better performance
      const leaderboard = await this.dashboardService.getLeaderboard(eventId);
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
      const startTime = Date.now();
      // Run both queries in parallel for better performance
      const [dashboardStats, publicStats] = await Promise.all([
        this.dashboardService.getDashboardStats(eventId),
        this.dashboardService.getPublicStats(eventId),
      ]);
      const queryTime = Date.now() - startTime;

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
      const totalTime = Date.now() - startTime;
      if (totalTime > 1000) {
        console.log(`[LeaderboardGateway] Dashboard stats update took ${totalTime}ms (queries: ${queryTime}ms) for eventId: ${eventId || 'global'}`);
      }
    } catch (error) {
      console.error('Failed to emit dashboard stats update:', error);
    }
  }

  // Method to emit both leaderboard and dashboard updates
  async emitFullUpdate(eventId?: string) {
    try {
      const startTime = Date.now();
      // Emit both updates in parallel for faster response
      await Promise.all([
        this.emitDashboardStatsUpdate(eventId),
        this.emitLeaderboardUpdate(eventId),
      ]);
      const duration = Date.now() - startTime;
      console.log(`[LeaderboardGateway] Full update emitted in ${duration}ms for eventId: ${eventId || 'global'}`);
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

  // Method to emit leaderboard view settings updates
  emitLeaderboardViewSettingsUpdate(settings: any) {
    try {
      this.server.emit('leaderboard-view-settings:update', settings);
    } catch (error) {
      console.error('Failed to emit leaderboard view settings update:', error);
    }
  }
}
