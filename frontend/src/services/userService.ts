import { api } from './api';
import type { User } from '../types/user';

export const userService = {
  async getAllUsers(withDeleted?: boolean): Promise<User[]> {
    const response = await api.get('/users', {
      params: { withDeleted }
    });
    return response.data;
  },

  async getUser(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async createUser(user: { name: string; gender: 'MALE' | 'FEMALE' }): Promise<User> {
    const response = await api.post('/users', user);
    return response.data;
  },

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    const response = await api.patch(`/users/${id}`, user);
    return response.data;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async addBeer(id: string): Promise<void> {
    await api.post(`/users/${id}/beers`);
  },

  async removeBeer(id: string): Promise<void> {
    await api.delete(`/users/${id}/beers`);
  },

  async cleanup(): Promise<void> {
    await api.post('/users/cleanup');
  },

  async getDeleted(): Promise<User[]> {
    const response = await api.get('/users/deleted');
    return response.data;
  },

  async getByEvent(eventId: string): Promise<User[]> {
    const response = await api.get(`/events/${eventId}/users`);
    return response.data;
  },

  async generateRegisterToken(userId: string) {
    const response = await api.post(`/users/${userId}/register-token`);
    return response.data;
  },

  async restoreUser(id: string) {
    const response = await api.patch(`/users/${id}/restore`);
    return response.data;
  }
}; 