import React from 'react';
import { FeatureFlagsProvider } from '../../contexts/FeatureFlagsContext';
import { SelectedEventProvider } from '../../contexts/SelectedEventContext';

interface DashboardProvidersProps {
  children: React.ReactNode;
}

export function DashboardProviders({ children }: DashboardProvidersProps) {
  return (
    <FeatureFlagsProvider>
      <SelectedEventProvider>
        {children}
      </SelectedEventProvider>
    </FeatureFlagsProvider>
  );
}