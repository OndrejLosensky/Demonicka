import { api } from './api';
import type { Barrel } from '@demonicka/shared-types';
import type { CreateBarrelDto } from '../types/dto';

class BarrelService {
  async getAll(withDeleted = false): Promise<Barrel[]> {
    const response = await api.get('/barrels', {
      params: { withDeleted },
    });
    return response.data;
  }

  async getDeleted(): Promise<Barrel[]> {
    const response = await api.get('/barrels/deleted');
    return response.data;
  }

  async getActiveBarrel(): Promise<Barrel | null> {
    const response = await api.get('/barrels/active/current');
    return response.data;
  }

  async getByEvent(eventId: string, withDeleted = false): Promise<Barrel[]> {
    const response = await api.get(`/events/${eventId}/barrels`, {
      params: { withDeleted },
    });
    return response.data;
  }

  async getById(id: string): Promise<Barrel> {
    const response = await api.get(`/barrels/${id}`);
    return response.data;
  }

  async create(data: CreateBarrelDto): Promise<Barrel> {
    const response = await api.post('/barrels', data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/barrels/${id}`);
  }

  async activate(id: string): Promise<Barrel> {
    const response = await api.patch(`/barrels/${id}/activate`);
    return response.data;
  }

  async cleanup(): Promise<void> {
    await api.post('/barrels/cleanup');
  }
}

export const barrelService = new BarrelService(); 