import { apiClient as api } from '../../../../utils/apiClient';
import type { User } from '../../../../types/user';

export const profileApi = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
}; 