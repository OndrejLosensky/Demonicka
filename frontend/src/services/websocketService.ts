import { io, Socket } from 'socket.io-client';
import { config } from '../config/index';
import type { LeaderboardData } from '../pages/Leaderboard/types';
import type { DashboardStats } from '../types/dashboard';
import type { PublicStats } from '../types/public';

type WebSocketEvents = {
  'leaderboard:update': LeaderboardData;
  'dashboard:update': void;
  'dashboard:stats:update': {
    dashboard: DashboardStats;
    public: PublicStats;
  };
  'event:join': { eventId: string };
  'event:leave': { eventId: string };
};

class WebSocketService {
  private socket: Socket | null = null;
  private eventHandlers: Map<keyof WebSocketEvents, Set<(data: WebSocketEvents[keyof WebSocketEvents]) => void>> = new Map();

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(config.wsUrl, {
      transports: ['websocket'],
      withCredentials: true,
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Listen for leaderboard updates
    this.socket.on('leaderboard:update', (data: WebSocketEvents['leaderboard:update']) => {
      this.notifyEventListeners('leaderboard:update', data);
    });

    // Listen for dashboard refresh triggers
    this.socket.on('dashboard:update', () => {
      this.notifyEventListeners('dashboard:update', undefined as unknown as void);
    });

    // Listen for dashboard stats updates (new real-time data)
    this.socket.on('dashboard:stats:update', (data: WebSocketEvents['dashboard:stats:update']) => {
      console.log('WebSocket: dashboard:stats:update received:', data);
      this.notifyEventListeners('dashboard:stats:update', data);
    });

    // Legacy event names for backward compatibility
    this.socket.on('leaderboardUpdate', (data: WebSocketEvents['leaderboard:update']) => {
      this.notifyEventListeners('leaderboard:update', data);
    });

    this.socket.on('dashboardStatsUpdate', (data: WebSocketEvents['dashboard:stats:update']) => {
      this.notifyEventListeners('dashboard:stats:update', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribe<T extends keyof WebSocketEvents>(
    eventName: T,
    callback: (data: WebSocketEvents[T]) => void
  ) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set());
    }
    this.eventHandlers.get(eventName)?.add(callback as (data: WebSocketEvents[keyof WebSocketEvents]) => void);
  }

  unsubscribe<T extends keyof WebSocketEvents>(
    eventName: T,
    callback: (data: WebSocketEvents[T]) => void
  ) {
    this.eventHandlers.get(eventName)?.delete(callback as (data: WebSocketEvents[keyof WebSocketEvents]) => void);
  }

  private notifyEventListeners<T extends keyof WebSocketEvents>(
    eventName: T,
    data: WebSocketEvents[T]
  ) {
    const handlers = this.eventHandlers.get(eventName);
    console.log(`WebSocket: Notifying ${handlers?.size || 0} listeners for ${eventName}:`, data);
    
    handlers?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${eventName} event handler:`, error);
      }
    });
  }

  // Join a specific event room to receive updates
  joinEvent(eventId: string) {
    if (this.socket?.connected) {
      this.socket.emit('event:join', { eventId });
    }
  }

  // Leave a specific event room
  leaveEvent(eventId: string) {
    if (this.socket?.connected) {
      this.socket.emit('event:leave', { eventId });
    }
  }
}

export const websocketService = new WebSocketService();

// Initialize the connection
websocketService.connect(); 