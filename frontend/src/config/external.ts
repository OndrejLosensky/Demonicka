// External Dependencies Configuration
import { QueryClient } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { APP_CONFIG } from './constants';

// Query Client Configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: APP_CONFIG.QUERY_RETRY_COUNT,
      refetchOnWindowFocus: false,
      staleTime: APP_CONFIG.QUERY_STALE_TIME,
      gcTime: APP_CONFIG.QUERY_CACHE_TIME,
    },
  },
});

// Localization Provider Component
export { LocalizationProvider, AdapterDateFns };
