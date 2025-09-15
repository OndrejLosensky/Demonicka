import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES, USER_ROLES } from './constants';
import {
  Login,
  Register,
  Dashboard,
  Participants,
  Barrels,
  BeerPong,
  Leaderboard,
  Landing,
  ProfilePage,
  Events,
  EventDetail,
  EventResults,
  Docs,
  CompleteRegistration,
  EnterToken,
  SystemPage,
  Logs,
  PersonalStatsView,
  AchievementsPage,
  ArrivalRegistration,
} from '../pages';
import { Layout, RoleRoute } from '../components';

// Guest Route Component (for unauthenticated users)
function GuestRoute({ children }: { children: React.ReactElement }) {
  const { user, isLoading, hasRole } = useAuth();
  if (isLoading) return null;
  if (user) {
    if (hasRole([USER_ROLES.USER])) {
      return <Navigate to={ROUTES.USER_DASHBOARD(user.id)} replace />;
    } else {
      return <Navigate to={ROUTES.DASHBOARD} replace />;
    }
  }
  return children;
}

// Main App Routes Configuration
export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Layout />}>
        {/* Public Routes */}
        <Route index element={<Landing />} />
        
        {/* Admin Routes */}
        <Route
          path="dashboard"
          element={
            <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <Dashboard />
            </RoleRoute>
          }
        />
        <Route
          path="dashboard/participants"
          element={
            <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <Participants />
            </RoleRoute>
          }
        />
        <Route
          path="dashboard/barrels"
          element={
            <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <Barrels />
            </RoleRoute>
          }
        />
        <Route
          path="dashboard/beer-pong"
          element={
            <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <BeerPong />
            </RoleRoute>
          }
        />
        <Route
          path="dashboard/system"
          element={
            <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <SystemPage />
            </RoleRoute>
          }
        />
        <Route
          path="dashboard/leaderboard"
          element={
            <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <Leaderboard />
            </RoleRoute>
          }
        />
        <Route
          path="system/logs"
          element={
            <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <Logs />
            </RoleRoute>
          }
        />
        <Route
          path="events"
          element={
            <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <Events />
            </RoleRoute>
          }
        />
        <Route
          path="events/:id"
          element={
            <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <EventDetail />
            </RoleRoute>
          }
        />
        <Route
          path="events/:id/results"
          element={
            <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <EventResults />
            </RoleRoute>
          }
        />
        <Route
          path="system/docs"
          element={
            <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <Docs />
            </RoleRoute>
          }
        />
        
        {/* Shared Routes (Admin + User) */}
        <Route
          path="profile"
          element={
            <RoleRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.USER]}>
              <ProfilePage />
            </RoleRoute>
          }
        />
        <Route
          path="achievements"
          element={
            <RoleRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.USER]}>
              <AchievementsPage />
            </RoleRoute>
          }
        />
        
        {/* User Routes */}
        <Route
          path=":userId/dashboard"
          element={
            <RoleRoute allowedRoles={[USER_ROLES.USER]}>
              <PersonalStatsView />
            </RoleRoute>
          }
        />
      </Route>
      
      {/* Auth Routes (Guest only) */}
      <Route
        path={ROUTES.LOGIN}
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path={ROUTES.REGISTER}
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />
      <Route
        path={ROUTES.COMPLETE_REGISTRATION}
        element={
          <GuestRoute>
            <CompleteRegistration />
          </GuestRoute>
        }
      />
      <Route
        path={ROUTES.ENTER_TOKEN}
        element={
          <GuestRoute>
            <EnterToken />
          </GuestRoute>
        }
      />
      
      {/* Public Event Routes (no auth required) */}
      <Route path="event/:eventId/arrival" element={<ArrivalRegistration />} />
      <Route path="arrival/:token" element={<ArrivalRegistration />} />
      
      {/* Fallback Route */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}
