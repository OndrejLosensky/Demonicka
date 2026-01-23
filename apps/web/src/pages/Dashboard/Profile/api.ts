import type { User } from '@demonicka/shared-types';
import { api } from '../../../services/api';

export const profileApi = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/users/me');
    return response.data;
  },
  updateProfile: async (data: Partial<Pick<User, 'name' | 'gender' | 'firstName' | 'lastName' | 'email'>>): Promise<User> => {
    const response = await api.patch('/users/me', data);
    return response.data;
  },
  uploadProfilePicture: async (file: File): Promise<{ profilePictureUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/users/me/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  enableTwoFactor: async (): Promise<{ message: string }> => {
    const response = await api.post('/auth/2fa/enable');
    return response.data;
  },
  verifyTwoFactorCode: async (code: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/2fa/verify', { code });
    return response.data;
  },
  disableTwoFactor: async (): Promise<{ message: string }> => {
    const response = await api.post('/auth/2fa/disable');
    return response.data;
  },
  unlinkGoogleAccount: async (): Promise<{ message: string }> => {
    const response = await api.post('/auth/google/unlink');
    return response.data;
  },
};
