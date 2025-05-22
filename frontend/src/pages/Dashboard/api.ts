import axios from 'axios';
import type { DashboardData } from '../../types/dashboard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create an axios instance with proper configuration
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

export const dashboardApi = {
  getOverview: async (): Promise<DashboardData> => {
    const response = await api.get('/dashboard/overview');
    return response.data;
  },
}; 