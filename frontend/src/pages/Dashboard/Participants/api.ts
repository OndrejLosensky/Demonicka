import axios from 'axios';
import type { Participant } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create an axios instance with proper configuration
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

export const participantsApi = {
  getAll: async (withDeleted?: boolean): Promise<Participant[]> => {
    const response = await api.get('/participants', {
      params: { withDeleted }
    });
    return response.data;
  },

  getDeleted: async (): Promise<Participant[]> => {
    const response = await api.get('/participants/deleted');
    return response.data;
  },

  create: async (data: { name: string; gender: 'MALE' | 'FEMALE' }): Promise<Participant> => {
    const response = await api.post('/participants', data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/participants/${id}`);
  },

  addBeer: async (id: string): Promise<void> => {
    await api.post(`/participants/${id}/beers`);
  },

  removeBeer: async (id: string): Promise<void> => {
    await api.delete(`/participants/${id}/beers`);
  },

  cleanup: async (): Promise<void> => {
    await api.post('/participants/cleanup');
  },
}; 