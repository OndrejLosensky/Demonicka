export type FeatureFlag = {
  enabled: boolean;
  description: string;
};

export type FeatureFlags = {
  [key: string]: FeatureFlag;
};

// Define the available feature flag keys
export enum FeatureFlagKey {
  HISTORY_PAGE = 'HISTORY_PAGE',
  LEADERBOARD_YEAR_FILTER = 'LEADERBOARD_YEAR_FILTER',
  SHOW_DELETED_PARTICIPANTS = 'SHOW_DELETED_PARTICIPANTS',
  SHOW_DELETED_BARRELS = 'SHOW_DELETED_BARRELS',
  BARREL_STATUS_TOGGLE = 'BARREL_STATUS_TOGGLE'
} 