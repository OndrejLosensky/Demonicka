import { api } from './api';

export interface SystemUser {
  id: string;
  username: string;
  role: string;
  isRegistrationComplete: boolean;
  isTwoFactorEnabled: boolean;
  canLogin: boolean;
  lastAdminLogin: string | null; // Changed from Date to string since API returns ISO string
}

export interface SystemStats {
  users: SystemUser[];
  totalUsers: number;
  totalAdminUsers: number;
  totalCompletedRegistrations: number;
  total2FAEnabled: number;
}

export const systemService = {
  async getSystemStats(): Promise<SystemStats> {
    try {
      console.log('Fetching system stats from API...');
      const response = await api.get('/dashboard/system');
      console.log('System stats API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching system stats:', error);
      throw error;
    }
  }
}; 