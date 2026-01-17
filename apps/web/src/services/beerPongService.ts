import { api } from './api';
import type {
  BeerPongEvent,
  CreateBeerPongEventDto,
  UpdateBeerPongEventDto,
  CreateTeamDto,
  CompleteGameDto,
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
    const response = await api.get(`/beer-pong/${id}`);
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
};
