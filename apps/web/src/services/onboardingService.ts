import { api } from './api';
import type { OnboardingTour } from '../types/onboarding';

export const onboardingService = {
  async completeOnboarding(): Promise<{ message: string }> {
    const response = await api.post('/auth/onboarding/complete');
    return response.data;
  },

  async getTourConfig(tourId: string): Promise<OnboardingTour> {
    // Load JSON config file dynamically
    const config = await import(`../config/onboarding/${tourId}.json`);
    return config.default as OnboardingTour;
  },
};
