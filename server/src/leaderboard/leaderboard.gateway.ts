import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LeaderboardService } from './leaderboard.service';

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

  constructor(private readonly leaderboardService: LeaderboardService) {}

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
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

  // Signal dashboards to refresh data
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
