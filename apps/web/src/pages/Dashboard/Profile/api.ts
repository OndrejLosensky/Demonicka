import type { User } from '@demonicka/shared-types';
import { api } from '../../../services/api';

export const profileApi = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/users/me');
    return response.data;
  },
};
