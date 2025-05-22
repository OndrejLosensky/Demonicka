import type { PublicStats } from '../types/public';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const landingApi = {
  getStats: async (): Promise<PublicStats> => {
    const response = await fetch(`${BASE_URL}/api/dashboard/public`);
    if (!response.ok) {
      throw new Error('Failed to fetch public stats');
    }
    return response.json();
  }
}; 