import { api } from './api';
import type {
  UserDashboardEventBeerPong,
  UserDashboardEventDetail,
  UserDashboardEventList,
  UserDashboardOverview,
} from '../types/userDashboard';

export const userDashboardService = {
  async getOverview(username: string): Promise<UserDashboardOverview> {
    const response = await api.get('/dashboard/user/overview', {
      params: { username },
    });
    return response.data;
  },

  async getEvents(username: string): Promise<UserDashboardEventList> {
    const response = await api.get('/dashboard/user/events', {
      params: { username },
    });
    return response.data;
  },

  async getEventDetail(username: string, eventId: string): Promise<UserDashboardEventDetail> {
    const response = await api.get(`/dashboard/user/events/${eventId}`, {
      params: { username },
    });
    return response.data;
  },

  async getEventBeerPong(username: string, eventId: string): Promise<UserDashboardEventBeerPong> {
    const response = await api.get(`/dashboard/user/events/${eventId}/beer-pong`, {
      params: { username },
    });
    return response.data;
  },
};

