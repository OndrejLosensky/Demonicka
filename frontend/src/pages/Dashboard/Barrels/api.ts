import type { Barrel } from './types';
import { api } from '../../../services/api';

export const barrelsApi = {
  getAll: async (withDeleted?: boolean): Promise<Barrel[]> => {
    const response = await api.get('/barrels', {
      params: { withDeleted }
    });
    return response.data;
  },

  getByEvent: async (eventId: string): Promise<Barrel[]> => {
    const response = await api.get(`/events/${eventId}/barrels`);
    return response.data;
  },

  getDeleted: async (): Promise<Barrel[]> => {
    const response = await api.get('/barrels/deleted');
    return response.data;
  },

  create: async (data: { size: number; orderNumber: number }): Promise<Barrel> => {
    const response = await api.post('/barrels', data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/barrels/${id}`);
  },

  toggleActive: async (id: string): Promise<void> => {
    await api.patch(`/barrels/${id}/toggle-active`);
  },

  cleanup: async (): Promise<void> => {
    await api.post('/barrels/cleanup');
  },
}; 