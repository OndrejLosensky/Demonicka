import type { Participant } from './types';
import { api } from '../../../services/api';

export const participantsApi = {
  getAll: async (withDeleted?: boolean): Promise<Participant[]> => {
    const response = await api.get('/users', {
      params: { withDeleted }
    });
    return response.data;
  },

  getByEvent: async (eventId: string, withDeleted?: boolean): Promise<Participant[]> => {
    // Get users in the event
    const usersResponse = await api.get(`/events/${eventId}/users`, {
      params: { withDeleted }
    });
    const users: Participant[] = usersResponse.data;

    // Get event-specific beer counts for each user
    const usersWithEventBeers = await Promise.all(
      users.map(async (user: Participant) => {
        const beerCountResponse = await api.get(`/events/${eventId}/users/${user.id}/beers/count`);
        return {
          ...user,
          eventBeerCount: beerCountResponse.data
        };
      })
    );

    return usersWithEventBeers;
  },

  getDeleted: async (): Promise<Participant[]> => {
    const response = await api.get('/users/deleted');
    return response.data;
  },

  create: async (data: { name: string; gender: 'MALE' | 'FEMALE' }): Promise<Participant> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  addBeer: async (id: string, eventId?: string): Promise<void> => {
    if (eventId) {
      await api.post(`/events/${eventId}/users/${id}/beers`);
    } else {
      await api.post(`/users/${id}/beers`);
    }
  },

  removeBeer: async (id: string, eventId?: string): Promise<void> => {
    if (eventId) {
      await api.delete(`/events/${eventId}/users/${id}/beers`);
    } else {
      await api.delete(`/users/${id}/beers`);
    }
  },

  cleanup: async (): Promise<void> => {
    await api.post('/users/cleanup');
  },
}; 