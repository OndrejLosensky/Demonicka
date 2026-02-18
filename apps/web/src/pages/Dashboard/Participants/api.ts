import type { Participant } from './types';
import { api } from '../../../services/api';

interface CreateParticipantDto {
  username: string;
  gender: 'MALE' | 'FEMALE';
}

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

  getEventBeers: async (eventId: string, userId: string, includeDeleted = false) => {
    const params = includeDeleted ? { includeDeleted: 'true' } : undefined;
    const response = await api.get(`/events/${eventId}/users/${userId}/beers`, { params });
    return response.data as Array<{
      id: string;
      consumedAt: string;
      spilled: boolean;
      barrelId: string | null;
      deletedAt: string | null;
      beerSize?: 'SMALL' | 'LARGE';
      volumeLitres?: number | string;
    }>;
  },

  create: async (data: CreateParticipantDto): Promise<Participant> => {
    const response = await api.post('/users/participant', data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  restore: async (id: string): Promise<void> => {
    await api.post(`/users/${id}/restore`);
  },

  addBeer: async (id: string, eventId?: string, options?: { spilled?: boolean; beerSize?: 'SMALL' | 'LARGE'; volumeLitres?: number }): Promise<void> => {
    if (eventId) {
      const body: { spilled?: boolean; beerSize?: 'SMALL' | 'LARGE'; volumeLitres?: number } = {};
      if (options?.spilled) body.spilled = true;
      if (options?.beerSize) body.beerSize = options.beerSize;
      if (options?.volumeLitres !== undefined) body.volumeLitres = options.volumeLitres;
      await api.post(
        `/events/${eventId}/users/${id}/beers`,
        Object.keys(body).length > 0 ? body : undefined,
      );
    } else {
      await api.post(`/users/${id}/beers`);
    }
  },

  addSpilledBeer: async (id: string, eventId: string): Promise<void> => {
    await api.post(`/events/${eventId}/users/${id}/beers`, { spilled: true });
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