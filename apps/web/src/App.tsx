import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Header from './components/navigation/Header';
import { CoreProviders } from './components/providers/CoreProviders';
import RoleRoute from './components/RoleRoute';
import GuestRoute from './components/GuestRoute';
import { USER_ROLE } from '@demonicka/shared-types';
import { DashboardLayout } from './routes/DashboardRoutes';
import { Dashboard } from './pages/Dashboard/Dashboard';
import Participants from './pages/Dashboard/Participants';
import Barrels from './pages/Dashboard/Barrels';
import Leaderboard from './pages/Dashboard/Leaderboard';
import ProfilePage from './pages/Dashboard/Profile/index';
import { Events } from './pages/Dashboard/Events';
import { EventDetail } from './pages/Dashboard/Events/EventDetail';
import { EventResults } from './pages/Dashboard/Events/EventResults';
import { Docs } from './pages/Dashboard/System/Docs';
import { SystemPage } from './pages/Dashboard/System';
import RolesPage from './pages/Dashboard/System/Roles';
import FeatureFlagsPage from './pages/Dashboard/System/FeatureFlags';
import { Activity } from './pages/User/Activity';
import { PersonalStatsView } from './pages/User/PersonalStats/PersonalStatsView';
import { AchievementsPage } from './pages/User/Achievements';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import { CompleteRegistration } from './pages/Auth/CompleteRegistration';
import { EnterToken } from './pages/Auth/EnterToken';

function App() {
  return (
    <CoreProviders>
      <Routes>
        <Route path="/" element={<Header />}>
          <Route index element={<Landing />} />
          <Route element={<DashboardLayout />}>
            <Route
              path="dashboard"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR, USER_ROLE.USER]}>
                  <Dashboard />
                </RoleRoute>
              }
            />
            <Route
              path="dashboard/participants"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]}>
                  <Participants />
                </RoleRoute>
              }
            />
            <Route
              path="dashboard/barrels"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]}>
                  <Barrels />
                </RoleRoute>
              }
            />
            <Route
              path="dashboard/system"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN]}>
                  <SystemPage />
                </RoleRoute>
              }
            />
            <Route
              path="dashboard/system/roles"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN]}>
                  <RolesPage />
                </RoleRoute>
              }
            />
            <Route
              path="dashboard/system/feature-flags"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN]}>
                  <FeatureFlagsPage />
                </RoleRoute>
              }
            />
            <Route
              path="activity"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN]}>
                  <Activity />
                </RoleRoute>
              }
            />
            <Route
              path="events"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]}>
                  <Events />
                </RoleRoute>
              }
            />
            <Route
              path="events/:id"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]}>
                  <EventDetail />
                </RoleRoute>
              }
            />
            <Route
              path="events/:id/results"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]}>
                  <EventResults />
                </RoleRoute>
              }
            />
            <Route
              path="docs"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN]}>
                  <Docs />
                </RoleRoute>
              }
            />
            <Route
              path="profile"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR, USER_ROLE.USER]}>
                  <ProfilePage />
                </RoleRoute>
              }
            />
            <Route
              path="leaderboard"
              element={<Leaderboard />}
            />
            <Route
              path=":userId/dashboard"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR, USER_ROLE.USER]}>
                  <PersonalStatsView />
                </RoleRoute>
              }
            />
            <Route
              path="achievements"
              element={
                <RoleRoute allowedRoles={[USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR, USER_ROLE.USER]}>
                  <AchievementsPage />
                </RoleRoute>
              }
            />
          </Route>
        </Route>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />
        <Route
          path="/complete-registration"
          element={
            <GuestRoute>
              <CompleteRegistration />
            </GuestRoute>
          }
        />
        <Route
          path="/enter-token"
          element={
            <GuestRoute>
              <EnterToken />
            </GuestRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CoreProviders>
  );
}

export default App;
