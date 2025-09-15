import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLE } from '../types';
import {
  Login,
  Register,
  Dashboard,
  Participants,
  Barrels,
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
  Activity,
  PersonalStatsView,
  AchievementsPage,
} from '../pages';
import { Layout, RoleRoute } from '../components';

// Guest Route Component (for unauthenticated users)
function GuestRoute({ children }: { children: React.ReactElement }) {
  const { user, isLoading, hasRole } = useAuth();
  if (isLoading) return null;
  if (user) {
    if (hasRole([USER_ROLE.USER])) {
      return <Navigate to={`/${user.id}/dashboard`} replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }
  return children;
}

// Main App Routes Configuration
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route index element={<Landing />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        
        {/* Admin Routes */}
        <Route
          path="dashboard"
          element={
            <RoleRoute allowedRoles={[USER_ROLE.ADMIN]}>
              <Dashboard />
            </RoleRoute>
          }
        />
        <Route
          path="dashboard/participants"
          element={
            <RoleRoute allowedRoles={[USER_ROLE.ADMIN]}>
              <Participants />
            </RoleRoute>
          }
        />
        <Route
          path="dashboard/barrels"
          element={
            <RoleRoute allowedRoles={[USER_ROLE.ADMIN]}>
              <Barrels />
            </RoleRoute>
          }
        />
        <Route
          path="dashboard/system"
          element={
            <RoleRoute allowedRoles={[USER_ROLE.ADMIN]}>
              <SystemPage />
            </RoleRoute>
          }
        />
        <Route
          path="activity"
          element={
            <RoleRoute allowedRoles={[USER_ROLE.ADMIN]}>
              <Activity />
            </RoleRoute>
          }
        />
        <Route
          path="events"
          element={
            <RoleRoute allowedRoles={[USER_ROLE.ADMIN]}>
              <Events />
            </RoleRoute>
          }
        />
        <Route
          path="events/:id"
          element={
            <RoleRoute allowedRoles={[USER_ROLE.ADMIN]}>
              <EventDetail />
            </RoleRoute>
          }
        />
        <Route
          path="events/:id/results"
          element={
            <RoleRoute allowedRoles={[USER_ROLE.ADMIN]}>
              <EventResults />
            </RoleRoute>
          }
        />
        <Route
          path="docs"
          element={
            <RoleRoute allowedRoles={[USER_ROLE.ADMIN]}>
              <Docs />
            </RoleRoute>
          }
        />
        
        {/* Shared Routes (Admin + User) */}
        <Route
          path="profile"
          element={
            <RoleRoute allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.USER]}>
              <ProfilePage />
            </RoleRoute>
          }
        />
        <Route
          path="achievements"
          element={
            <RoleRoute allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.USER]}>
              <AchievementsPage />
            </RoleRoute>
          }
        />
        
        {/* User Routes */}
        <Route
          path=":userId/dashboard"
          element={
            <RoleRoute allowedRoles={[USER_ROLE.USER]}>
              <PersonalStatsView />
            </RoleRoute>
          }
        />
      </Route>
      
      {/* Auth Routes (Guest only) */}
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
      
      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
