import { api } from './api';

export interface FeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export const featureFlagsService = {
  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    const response = await api.get('/system/feature-flags');
    return response.data;
  },

  async getFeatureFlag(id: string): Promise<FeatureFlag> {
    const response = await api.get(`/system/feature-flags/${id}`);
    return response.data;
  },

  async updateFeatureFlag(
    id: string,
    enabled: boolean,
  ): Promise<FeatureFlag> {
    const response = await api.put(`/system/feature-flags/${id}`, {
      enabled,
    });
    return response.data;
  },
};
