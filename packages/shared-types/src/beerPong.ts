/**
 * Beer Pong Tournament Types
 */

export enum BeerPongEventStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export enum BeerPongGameStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum BeerPongRound {
  QUARTERFINAL = 'QUARTERFINAL',
  SEMIFINAL = 'SEMIFINAL',
  FINAL = 'FINAL',
}

export enum CancellationPolicy {
  KEEP_BEERS = 'KEEP_BEERS',
  REMOVE_BEERS = 'REMOVE_BEERS',
}

export interface BeerPongEvent {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  status: BeerPongEventStatus;
  beersPerPlayer: number;
  timeWindowMinutes: number;
  undoWindowMinutes: number;
  cancellationPolicy: CancellationPolicy;
  startedAt?: string;
  completedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  teams?: BeerPongTeam[];
  games?: BeerPongGame[];
}

/** Event-level team pool; reusable across BeerPongEvents (tournaments) in the same event. */
export interface EventBeerPongTeam {
  id: string;
  eventId: string;
  name: string;
  player1Id: string;
  player2Id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  player1?: {
    id: string;
    username?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  };
  player2?: {
    id: string;
    username?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface BeerPongTeam {
  id: string;
  beerPongEventId: string;
  eventBeerPongTeamId?: string;
  name: string;
  player1Id: string;
  player2Id: string;
  createdAt: string;
  deletedAt?: string;
  player1?: {
    id: string;
    username?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  };
  player2?: {
    id: string;
    username?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface BeerPongGame {
  id: string;
  beerPongEventId: string;
  round: BeerPongRound;
  team1Id: string;
  team2Id: string;
  winnerTeamId?: string;
  status: BeerPongGameStatus;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  startedBy?: string;
  beersAddedAt?: string;
  createdAt: string;
  updatedAt: string;
  team1?: BeerPongTeam;
  team2?: BeerPongTeam;
  winnerTeam?: BeerPongTeam;
}

export interface BeerPongGameBeer {
  id: string;
  beerPongGameId: string;
  userId: string;
  eventBeerId: string;
  createdAt: string;
}

export interface CreateBeerPongEventDto {
  eventId: string;
  name: string;
  description?: string;
  beersPerPlayer?: number;
  timeWindowMinutes?: number;
  undoWindowMinutes?: number;
  cancellationPolicy?: CancellationPolicy;
}

export interface UpdateBeerPongEventDto {
  name?: string;
  description?: string;
  beersPerPlayer?: number;
  timeWindowMinutes?: number;
  undoWindowMinutes?: number;
  cancellationPolicy?: CancellationPolicy;
}

export interface CreateTeamDto {
  name: string;
  player1Id: string;
  player2Id: string;
}

export interface CompleteGameDto {
  winnerTeamId: string;
}
