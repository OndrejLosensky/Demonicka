export const API_VERSIONS = {
  V1: '1',
  V2: '2',
} as const;

export const LATEST_VERSION = API_VERSIONS.V1;

export interface VersionConfig {
  version: string;
  deprecated?: boolean;
  sunset?: Date;
}

export const VERSION_CONFIGS: Record<string, VersionConfig> = {
  [API_VERSIONS.V1]: {
    version: API_VERSIONS.V1,
    deprecated: false,
  },
  [API_VERSIONS.V2]: {
    version: API_VERSIONS.V2,
    deprecated: false,
  },
};
