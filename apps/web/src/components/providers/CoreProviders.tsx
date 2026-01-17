import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthProvider } from '../../contexts/AuthContext';
import { AppThemeProvider } from '../../contexts/ThemeContext';
import { ActiveEventProvider } from '../../contexts/ActiveEventContext';
import { HeaderVisibilityProvider } from '../../contexts/HeaderVisibilityContext';

const queryClient = new QueryClient();

interface CoreProvidersProps {
  children: React.ReactNode;
}

export function CoreProviders({ children }: CoreProvidersProps) {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <AuthProvider>
              <ActiveEventProvider>
                <HeaderVisibilityProvider>
                  {children}
                </HeaderVisibilityProvider>
              </ActiveEventProvider>
            </AuthProvider>
          </LocalizationProvider>
        </AppThemeProvider>
      </QueryClientProvider>
    </Router>
  );
}