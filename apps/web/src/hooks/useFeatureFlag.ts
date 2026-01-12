import { FeatureFlagKey } from '../types/featureFlags';
import { isFeatureEnabled } from '../config/featureFlags';

export const useFeatureFlag = (featureKey: FeatureFlagKey): boolean => {
  return isFeatureEnabled(featureKey);
}; 