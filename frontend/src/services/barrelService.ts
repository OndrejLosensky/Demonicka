import type { Barrel } from '../types/barrel';
import { api } from './api';

export const barrelService = {
    async getAllBarrels(): Promise<Barrel[]> {
        const response = await api.get('/barrels');
        return response.data;
    }
}; 