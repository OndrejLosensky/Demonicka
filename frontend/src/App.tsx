import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

// Organized imports from index files
import {
  AuthProvider,
  AppThemeProvider,
  ActiveEventProvider,
  SelectedEventProvider,
  HeaderVisibilityProvider,
  SidebarProvider,
  SearchProvider,
} from './contexts';

import { queryClient, LocalizationProvider, AdapterDateFns } from './config/external';
import { AppRoutes } from './config/routes';

function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <AuthProvider>
              <ActiveEventProvider>
                <SelectedEventProvider>
                  <HeaderVisibilityProvider>
                    <SidebarProvider>
                      <SearchProvider>
                        <AppRoutes />
                      </SearchProvider>
                    </SidebarProvider>
                  </HeaderVisibilityProvider>
                </SelectedEventProvider>
              </ActiveEventProvider>
            </AuthProvider>
          </LocalizationProvider>
        </AppThemeProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;
