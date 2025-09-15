import React from 'react';
import { PageLoader } from '../ui';

interface WithLoadingProps {
  isLoading?: boolean;
  loadingMessage?: string;
}

export function withPageLoader<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithLoadingComponent({
    isLoading = false,
    loadingMessage,
    ...props
  }: P & WithLoadingProps) {
    if (isLoading) {
      return <PageLoader message={loadingMessage} />;
    }

    return <WrappedComponent {...props as P} />;
  };
} 