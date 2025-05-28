import { apiClient } from '../utils/apiClient';
import type { UserStats } from '../types/stats';
import type { AxiosError } from 'axios';

interface ApiErrorResponse {
  message: string;
  statusCode: number;
}

class ApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export const UserStatsService = {
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const response = await apiClient.get<UserStats>(`/users/${userId}/stats`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      if (axiosError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new ApiError(
          axiosError.response.data?.message || 'Failed to fetch user statistics',
          axiosError.response.status
        );
      } else if (axiosError.request) {
        // The request was made but no response was received
        throw new ApiError('No response from server');
      } else {
        // Something happened in setting up the request
        throw new ApiError('Error setting up the request');
      }
    }
  },
}; 