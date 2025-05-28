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
    enabled: false,
    description: 'Shows event history selector in dashboard, leaderboard, participants and barrels pages',
  },
  [FeatureFlagKey.SHOW_PARTICIPANTS_HISTORY]: {
    enabled: false,
    description: 'Shows event history functionality specifically for participants page',
  },
  [FeatureFlagKey.SHOW_BARRELS_HISTORY]: {
    enabled: false,
    description: 'Shows event history functionality specifically for barrels page',
  },
  [FeatureFlagKey.ACTIVE_EVENT_FUNCTIONALITY]: {
    enabled: true,
    description: 'Enables active event management and force active event buttons',
  },
};

export const isFeatureEnabled = (featureKey: FeatureFlagKey): boolean => {
  return featureFlags[featureKey]?.enabled ?? false;
};

export const getAllFeatureFlags = (): FeatureFlags => {
  return featureFlags;
}; 