import { io, Socket } from 'socket.io-client';
import { config } from '../config';

type EventCallback = (data: unknown) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private subscribers: Map<string, Set<EventCallback>> = new Map();
  private currentEventId: string | null = null;

  connect(token?: string): void {
    if (this.socket?.connected) return;

    this.socket = io(config.wsUrl, {
      transports: ['websocket'],
      withCredentials: true,
      autoConnect: true,
      auth: token ? { token } : undefined,
    });

    this.socket.on('connect', () => {
      console.log('[WS] Connected');
      // Rejoin event room if we had one
      if (this.currentEventId) {
        this.joinEvent(this.currentEventId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WS] Connection error:', error.message);
    });

    // Set up event forwarding to subscribers
    this.setupEventForwarding();
  }

  private setupEventForwarding(): void {
    const events = [
      'leaderboard:update',
      'leaderboardUpdate', // Legacy
      'dashboard:stats:update',
      'dashboardStatsUpdate', // Legacy
      'dashboard:update',
      'leaderboard-view-settings:update',
    ];

    events.forEach((event) => {
      this.socket?.on(event, (data: unknown) => {
        this.notifySubscribers(event, data);
      });
    });
  }

  private notifySubscribers(event: string, data: unknown): void {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  disconnect(): void {
    if (this.currentEventId) {
      this.leaveEvent(this.currentEventId);
    }
    this.socket?.disconnect();
    this.socket = null;
    this.subscribers.clear();
  }

  joinEvent(eventId: string): void {
    if (this.currentEventId && this.currentEventId !== eventId) {
      this.leaveEvent(this.currentEventId);
    }
    this.currentEventId = eventId;
    this.socket?.emit('event:join', { eventId });
    console.log('[WS] Joined event room:', eventId);
  }

  leaveEvent(eventId: string): void {
    this.socket?.emit('event:leave', { eventId });
    if (this.currentEventId === eventId) {
      this.currentEventId = null;
    }
    console.log('[WS] Left event room:', eventId);
  }

  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(event)?.delete(callback);
    };
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const websocketService = new WebSocketService();
