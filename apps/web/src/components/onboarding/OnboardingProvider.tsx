import React from 'react';
import { OnboardingProvider as BaseOnboardingProvider } from '../../contexts/OnboardingContext';
import { OnboardingOverlay } from './OnboardingOverlay';

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseOnboardingProvider>
      {children}
      <OnboardingOverlay />
    </BaseOnboardingProvider>
  );
}
