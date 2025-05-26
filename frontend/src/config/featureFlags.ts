import type { FeatureFlags } from '../types/featureFlags';
import { FeatureFlagKey } from '../types/featureFlags';

export const featureFlags: FeatureFlags = {
  [FeatureFlagKey.HISTORY_PAGE]: {
    enabled: false,
    description: 'Enables the history page functionality showing past activities and events',
  },
  [FeatureFlagKey.LEADERBOARD_YEAR_FILTER]: {
    enabled: false,
    description: 'Adds year filtering capability to the leaderboard',
  },
  [FeatureFlagKey.SHOW_DELETED_PARTICIPANTS]: {
    enabled: false,
    description: 'Shows deleted participants with option to restore them',
  },
  [FeatureFlagKey.SHOW_DELETED_BARRELS]: {
    enabled: false,
    description: 'Shows deleted barrels with option to restore them',
  },
  [FeatureFlagKey.BARREL_STATUS_TOGGLE]: {
    enabled: false,
    description: 'Enables the status toggle button on barrel items',
  },
  [FeatureFlagKey.SHOW_EVENT_HISTORY]: {
    enabled: true,
    description: 'Shows event history selector in participants and barrels pages',
  },
};

export const isFeatureEnabled = (featureKey: FeatureFlagKey): boolean => {
  return featureFlags[featureKey]?.enabled ?? false;
};

export const getAllFeatureFlags = (): FeatureFlags => {
  return featureFlags;
}; 