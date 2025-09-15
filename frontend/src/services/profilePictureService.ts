import { apiClient as api } from '../utils/apiClient';
import { API_URL } from '../config/config';

export interface ProfilePictureUploadResponse {
  message: string;
  filename: string;
  url: string;
}

export interface ProfilePictureRemoveResponse {
  message: string;
}

export const profilePictureService = {
  async uploadProfilePicture(file: File): Promise<ProfilePictureUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/users/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async removeProfilePicture(): Promise<ProfilePictureRemoveResponse> {
    const response = await api.delete('/users/profile-picture');
    return response.data;
  },

  getProfilePictureUrl(filename: string): string {
    return `${API_URL}/users/profile-pictures/${filename}`;
  },
};
