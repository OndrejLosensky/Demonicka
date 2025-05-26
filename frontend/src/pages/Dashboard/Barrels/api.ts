import axios from 'axios';
import type { Barrel } from './types';
import { API_URL } from '../../../config';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

export const barrelsApi = {
  getAll: async (withDeleted?: boolean): Promise<Barrel[]> => {
    const response = await api.get('/barrels', {
      params: { withDeleted }
    });
    return response.data;
  },

  getDeleted: async (): Promise<Barrel[]> => {
    const response = await api.get('/barrels/deleted');
    return response.data;
  },

  create: async (data: { size: 15 | 30 | 50; orderNumber: number }): Promise<Barrel> => {
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