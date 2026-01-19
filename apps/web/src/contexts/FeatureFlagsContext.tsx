import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { FeatureFlagKey } from '@demonicka/shared-types';
import { featureFlagsService } from '../services/featureFlagsService';

interface FeatureFlagsContextType {
  isFeatureEnabled: (key: FeatureFlagKey) => boolean;
  isLoading: boolean;
  refreshFlags: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Record<string, boolean> | null>(null);
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
      console.error('Failed to load feature flags from API:', error);
      // No hardcoded fallback: keep features disabled if flags cannot be loaded.
      setFlags(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const isFeatureEnabled = (key: FeatureFlagKey): boolean => {
    // Only enable when we have a loaded flags map; otherwise keep disabled.
    return flags?.[key] ?? false;
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
