import { Outlet } from 'react-router-dom';
import { DashboardProviders } from '../components/providers/DashboardProviders';

// Dashboard layout component that wraps routes with dashboard-specific providers
export function DashboardLayout() {
  return (
    <DashboardProviders>
      <Outlet />
    </DashboardProviders>
  );
}