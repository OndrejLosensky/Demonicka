import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LeaderboardService } from './leaderboard.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class LeaderboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly leaderboardService: LeaderboardService) {}

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  // Method to emit leaderboard updates to all connected clients
  async emitLeaderboardUpdate(eventId?: string) {
    try {
      const leaderboard = await this.leaderboardService.getLeaderboard(eventId);
      this.server.emit('leaderboardUpdate', leaderboard);
    } catch (error) {
      console.error('Failed to emit leaderboard update:', error);
    }
  }
} 