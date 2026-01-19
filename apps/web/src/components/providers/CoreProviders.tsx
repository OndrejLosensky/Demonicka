import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Toaster } from 'react-hot-toast';
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
                  <Toaster
                    position="top-right"
                    gutter={10}
                    containerStyle={{ top: 72, zIndex: 20000 }}
                    toastOptions={{
                      duration: 3500,
                      style: {
                        background: 'var(--color-background-card)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid var(--color-border-primary)',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
                      },
                    }}
                  />
                </HeaderVisibilityProvider>
              </ActiveEventProvider>
            </AuthProvider>
          </LocalizationProvider>
        </AppThemeProvider>
      </QueryClientProvider>
    </Router>
  );
}