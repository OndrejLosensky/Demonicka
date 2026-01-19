export type UserDashboardUserDto = {
  id: string;
  username: string;
  name: string | null;
  profilePictureUrl?: string | null;
};

export type UserDashboardDailyPointDto = {
  /** ISO timestamp (bucket start) in UTC */
  date: string;
  /** Non-spilled beers in the selected event bucket */
  beers: number;
  /** Spilled beers in the selected event bucket */
  eventBeers: number;
  /** Total beers = beers + eventBeers */
  totalBeers: number;
};

export type UserDashboardTopEventDto = {
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

export type UserDashboardBeerPongSummaryDto = {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  beersFromBeerPong: number;
  averageGameDurationSeconds: number | null;
};

export type UserDashboardOverviewDto = {
  user: UserDashboardUserDto;
  totals: {
    beers: number;
    eventBeers: number;
    participatedEvents: number;
    totalBeers: number;
  };
  /** Event used for the overview time-series (active if present, otherwise latest participated). */
  activeEvent?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string | null;
    isActive: boolean;
  };
  daily: UserDashboardDailyPointDto[];
  topEvents: UserDashboardTopEventDto[];
  beerPong: UserDashboardBeerPongSummaryDto;
};

export type UserDashboardEventListDto = {
  user: UserDashboardUserDto;
  events: UserDashboardTopEventDto[];
};

export type UserDashboardHourlyPointDto = {
  /** ISO timestamp in UTC for the bucket start */
  bucketUtc: string;
  count: number;
  spilled: number;
};

export type UserDashboardEventDetailDto = {
  user: UserDashboardUserDto;
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
  hourly: UserDashboardHourlyPointDto[];
};

export type UserDashboardBeerPongTournamentDto = {
  id: string;
  name: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
};

export type UserDashboardBeerPongByRoundDto = {
  round: string;
  gamesPlayed: number;
  gamesWon: number;
};

export type UserDashboardEventBeerPongDto = {
  user: UserDashboardUserDto;
  event: {
    id: string;
    name: string;
    startDate: string;
    endDate: string | null;
    isActive: boolean;
  };
  tournaments: UserDashboardBeerPongTournamentDto[];
  summary: UserDashboardBeerPongSummaryDto & {
    gamesByRound: UserDashboardBeerPongByRoundDto[];
  };
};
