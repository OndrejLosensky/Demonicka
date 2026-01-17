import { api } from './api';
import type {
  BeerPongEvent,
  CreateBeerPongEventDto,
  UpdateBeerPongEventDto,
  CreateTeamDto,
  CompleteGameDto,
  EventBeerPongTeam,
} from '@demonicka/shared-types';

// Note: VersionMiddleware defaults to LATEST_VERSION ('1') if x-api-version header is missing
// So we don't need to send the header explicitly - the middleware will handle it

export const beerPongService = {
  /**
   * Get all beer pong tournaments for an event
   */
  async getByEvent(eventId: string): Promise<BeerPongEvent[]> {
    const response = await api.get(`/events/${eventId}/beer-pong`);
    return response.data;
  },

  /**
   * Get a single beer pong tournament with teams and games
   */
  async getById(id: string): Promise<BeerPongEvent> {
    console.log('[BeerPong getById] requesting /beer-pong/' + id);
    const response = await api.get(`/beer-pong/${id}`);
    console.log('[BeerPong getById] response status=', response?.status, 'games.length=', response?.data?.games?.length ?? 'n/a');
    return response.data;
  },

  /**
   * Create a new beer pong tournament
   */
  async create(data: CreateBeerPongEventDto): Promise<BeerPongEvent> {
    const response = await api.post('/beer-pong', data);
    return response.data;
  },

  /**
   * Update a beer pong tournament
   */
  async update(id: string, data: UpdateBeerPongEventDto): Promise<BeerPongEvent> {
    const response = await api.put(`/beer-pong/${id}`, data);
    return response.data;
  },

  /**
   * Delete a beer pong tournament (soft delete)
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/beer-pong/${id}`);
  },

  /**
   * Start a tournament (requires 8 teams)
   */
  async startTournament(id: string): Promise<BeerPongEvent> {
    const response = await api.post(`/beer-pong/${id}/start`);
    return response.data;
  },

  /**
   * Complete a tournament (mark as finished)
   */
  async completeTournament(id: string): Promise<BeerPongEvent> {
    const response = await api.post(`/beer-pong/${id}/complete`);
    return response.data;
  },

  /**
   * Create a team for a tournament
   */
  async createTeam(beerPongEventId: string, data: CreateTeamDto): Promise<any> {
    const response = await api.post(`/beer-pong/${beerPongEventId}/teams`, data);
    return response.data;
  },

  /**
   * Get all teams for a tournament
   */
  async getTeams(beerPongEventId: string): Promise<any[]> {
    const response = await api.get(`/beer-pong/${beerPongEventId}/teams`);
    return response.data;
  },

  /**
   * Delete a team from a tournament
   */
  async deleteTeam(beerPongEventId: string, teamId: string): Promise<void> {
    await api.delete(`/beer-pong/${beerPongEventId}/teams/${teamId}`);
  },

  /**
   * Start a game (adds +2 beers to each player)
   */
  async startGame(gameId: string): Promise<any> {
    const response = await api.post(`/beer-pong/games/${gameId}/start`);
    return response.data;
  },

  /**
   * Complete a game (mark winner)
   */
  async completeGame(gameId: string, data: CompleteGameDto): Promise<any> {
    const response = await api.post(`/beer-pong/games/${gameId}/complete`, data);
    return response.data;
  },

  /**
   * Undo game start (remove beers if within undo window)
   */
  async undoGameStart(gameId: string): Promise<any> {
    const response = await api.post(`/beer-pong/games/${gameId}/undo`);
    return response.data;
  },

  /**
   * Assign a team to a specific game position
   */
  async assignTeamToPosition(
    gameId: string,
    teamId: string,
    position: 'team1' | 'team2',
  ): Promise<any> {
    const response = await api.put(`/beer-pong/games/${gameId}/assign-team`, {
      teamId,
      position,
    });
    return response.data;
  },

  /**
   * Add an existing event-level team to this tournament (reuse from event pool)
   */
  async addTeamFromEvent(
    beerPongEventId: string,
    eventBeerPongTeamId: string,
  ): Promise<any> {
    const response = await api.post(`/beer-pong/${beerPongEventId}/teams/from-event`, {
      eventBeerPongTeamId,
    });
    return response.data;
  },
};

/**
 * Event-level Beer Pong Teams Service (for managing teams at event level)
 */
export const eventBeerPongTeamService = {
  /**
   * Get all event-level teams for an event
   */
  async getByEvent(eventId: string): Promise<EventBeerPongTeam[]> {
    const response = await api.get(`/events/${eventId}/beer-pong-teams`);
    return response.data;
  },

  /**
   * Create a new event-level team
   */
  async create(eventId: string, data: CreateTeamDto): Promise<EventBeerPongTeam> {
    const response = await api.post(`/events/${eventId}/beer-pong-teams`, data);
    return response.data;
  },

  /**
   * Delete an event-level team (soft delete)
   */
  async delete(eventId: string, teamId: string): Promise<void> {
    await api.delete(`/events/${eventId}/beer-pong-teams/${teamId}`);
  },
};
