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
    const response = await api.get(`/events/${eventId}/users`, {
      params: { withDeleted }
    });
    return response.data;
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

  addBeer: async (id: string): Promise<void> => {
    await api.post(`/users/${id}/beers`);
  },

  removeBeer: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}/beers`);
  },

  cleanup: async (): Promise<void> => {
    await api.post('/users/cleanup');
  },
}; 