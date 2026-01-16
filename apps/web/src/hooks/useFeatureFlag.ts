import { FeatureFlagKey } from '@demonicka/shared-types';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext';

export const useFeatureFlag = (featureKey: FeatureFlagKey): boolean => {
  const { isFeatureEnabled } = useFeatureFlags();
  return isFeatureEnabled(featureKey);
}; 