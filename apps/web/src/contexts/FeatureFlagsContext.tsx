import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { FeatureFlagKey } from '@demonicka/shared-types';
import { featureFlagsService } from '../services/featureFlagsService';
import { isFeatureEnabled as getHardcodedFeature } from '../config/featureFlags';

interface FeatureFlagsContextType {
  isFeatureEnabled: (key: FeatureFlagKey) => boolean;
  isLoading: boolean;
  refreshFlags: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadFlags = async () => {
    try {
      setIsLoading(true);
      const data = await featureFlagsService.getAllFeatureFlags();
      const flagsMap: Record<string, boolean> = {};
      data.forEach((flag) => {
        flagsMap[flag.key] = flag.enabled;
      });
      setFlags(flagsMap);
    } catch (error) {
      console.error('Failed to load feature flags from API, using hardcoded values:', error);
      // Fallback to hardcoded values
      const hardcodedFlags: Record<string, boolean> = {};
      Object.values(FeatureFlagKey).forEach((key) => {
        hardcodedFlags[key] = getHardcodedFeature(key);
      });
      setFlags(hardcodedFlags);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const isFeatureEnabled = (key: FeatureFlagKey): boolean => {
    // If flags are loaded from API, use them; otherwise fallback to hardcoded
    if (Object.keys(flags).length > 0) {
      return flags[key] ?? false;
    }
    return getHardcodedFeature(key);
  };

  return (
    <FeatureFlagsContext.Provider
      value={{
        isFeatureEnabled,
        isLoading,
        refreshFlags: loadFlags,
      }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
}
