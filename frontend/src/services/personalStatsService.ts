import { api } from './api';

export interface HourlyStats {
  hour: number;
  count: number;
}

export interface EventStats {
  eventId: string;
  eventName: string;
  userBeers: number;
  totalEventBeers: number;
  contribution: number;
  hourlyStats: HourlyStats[];
  averagePerHour: number;
}

export interface PersonalStats {
  totalBeers: number;
  eventStats: EventStats[];
}

export const personalStatsService = {
  async getPersonalStats(): Promise<PersonalStats> {
    const response = await api.get('/dashboard/personal');
    return response.data;
  }
}; 