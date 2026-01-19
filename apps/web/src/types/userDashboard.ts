export type UserDashboardUser = {
  id: string;
  username: string;
  name: string | null;
  profilePictureUrl?: string | null;
};

export type UserDashboardDailyPoint = {
  date: string; // ISO timestamp (UTC bucket start)
  beers: number;
  eventBeers: number;
  totalBeers: number;
};

export type UserDashboardTopEvent = {
  eventId: string;
  eventName: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  userBeers: number;
  totalEventBeers: number;
  sharePercent: number;
  userSpilledBeers: number;
};

export type UserDashboardBeerPongSummary = {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  beersFromBeerPong: number;
  averageGameDurationSeconds: number | null;
};

export type UserDashboardOverview = {
  user: UserDashboardUser;
  totals: {
    beers: number;
    eventBeers: number;
    participatedEvents: number;
    totalBeers: number;
  };
  activeEvent?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string | null;
    isActive: boolean;
  };
  daily: UserDashboardDailyPoint[];
  topEvents: UserDashboardTopEvent[];
  beerPong: UserDashboardBeerPongSummary;
};

export type UserDashboardEventList = {
  user: UserDashboardUser;
  events: UserDashboardTopEvent[];
};

export type UserDashboardHourlyPoint = {
  bucketUtc: string; // ISO timestamp
  count: number;
  spilled: number;
};

export type UserDashboardEventDetail = {
  user: UserDashboardUser;
  event: {
    id: string;
    name: string;
    startDate: string;
    endDate: string | null;
    isActive: boolean;
  };
  summary: {
    userBeers: number;
    userSpilledBeers: number;
    totalEventBeers: number;
    totalEventSpilledBeers: number;
    sharePercent: number;
  };
  hourly: UserDashboardHourlyPoint[];
};

export type UserDashboardBeerPongTournament = {
  id: string;
  name: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
};

export type UserDashboardBeerPongByRound = {
  round: string;
  gamesPlayed: number;
  gamesWon: number;
};

export type UserDashboardEventBeerPong = {
  user: UserDashboardUser;
  event: {
    id: string;
    name: string;
    startDate: string;
    endDate: string | null;
    isActive: boolean;
  };
  tournaments: UserDashboardBeerPongTournament[];
  summary: UserDashboardBeerPongSummary & {
    gamesByRound: UserDashboardBeerPongByRound[];
  };
};

