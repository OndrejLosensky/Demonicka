import { Outlet } from 'react-router-dom';
import { DashboardProviders } from '../components/providers/DashboardProviders';
import { DashboardChromeProvider } from '../contexts/DashboardChromeContext';
import { DashboardChrome } from '../components/layout/DashboardChrome';
import { AppContainer } from '../components/layout/AppContainer';

// Dashboard layout component that wraps routes with dashboard-specific providers
export function DashboardLayout() {
  return (
    <DashboardProviders>
      <DashboardChromeProvider>
        <AppContainer sx={{ py: 3 }}>
          <DashboardChrome />
          <Outlet />
        </AppContainer>
      </DashboardChromeProvider>
    </DashboardProviders>
  );
}