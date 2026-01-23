import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { cs } from 'date-fns/locale';
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
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={cs}>
            <AuthProvider>
              <ActiveEventProvider>
                <HeaderVisibilityProvider>
                  {children}
                  <Toaster
                    position="bottom-right"
                    gutter={10}
                    containerStyle={{ bottom: 20, zIndex: 20000 }}
                    toastOptions={{
                      duration: 3500,
                      style: {
                        background: 'var(--color-background-card)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid var(--color-border-primary)',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
                        padding: '12px 16px',
                        gap: '12px',
                      },
                    }}
                    closeButton={true}
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