import axios from 'axios';
import type { Barrel } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

export const barrelsApi = {
  getAll: async (): Promise<Barrel[]> => {
    const response = await api.get('/barrels');
    return response.data;
  },

  create: async (data: { size: 15 | 30 | 50 }): Promise<Barrel> => {
    const response = await api.post('/barrels', data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/barrels/${id}`);
  },

  update: async (id: string, data: { isActive: boolean }): Promise<Barrel> => {
    const response = await api.patch(`/barrels/${id}`, data);
    return response.data;
  },

  cleanup: async (): Promise<void> => {
    await api.post('/barrels/cleanup');
  },
}; 