import { Outlet } from 'react-router-dom';
import { DashboardProviders } from '../components/providers/DashboardProviders';
import { DashboardChromeProvider } from '../contexts/DashboardChromeContext';
import { DashboardChrome } from '../components/layout/DashboardChrome';

// Dashboard layout component that wraps routes with dashboard-specific providers
export function DashboardLayout() {
  return (
    <DashboardProviders>
      <DashboardChromeProvider>
        <DashboardChrome />
        <Outlet />
      </DashboardChromeProvider>
    </DashboardProviders>
  );
}