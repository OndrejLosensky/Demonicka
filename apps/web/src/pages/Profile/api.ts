import { api } from '../../services/api';
import type { User } from '@demonicka/shared-types';

export const profileApi = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
}; 