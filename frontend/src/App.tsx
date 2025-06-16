import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import RoleRoute from './components/RoleRoute';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import { Dashboard } from './pages/Dashboard/Dashboard';
import Participants from './pages/Dashboard/Participants';
import Barrels from './pages/Dashboard/Barrels';
import Leaderboard from './pages/Leaderboard';
import Landing from './pages/Landing';
import Header from './components/Header';
import ProfilePage from './pages/Profile/index';
import { Events } from './pages/Events';
import { EventDetail } from './pages/EventDetail';
import { Docs } from './pages/Docs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ActiveEventProvider } from './contexts/ActiveEventContext';
import { SelectedEventProvider } from './contexts/SelectedEventContext';
import { CompleteRegistration } from './pages/CompleteRegistration';
import { EnterToken } from './pages/Auth/EnterToken';
import { USER_ROLE } from './types/user';
import { SystemPage } from './pages/Dashboard/System';

const queryClient = new QueryClient();

function GuestRoute({ children }: { children: React.ReactElement }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  const theme = createTheme();

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <AuthProvider>
              <ActiveEventProvider>
                <SelectedEventProvider>
                  <Routes>
                    <Route path="/" element={<Header />}>
                      <Route index element={<Landing />} />
                      <Route
                        path="dashboard"
                        element={
                          <RoleRoute allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.USER]}>
                            <Dashboard />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="dashboard/participants"
                        element={
                          <RoleRoute allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.USER]}>
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
                        path="events"
                        element={
                          <RoleRoute allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.USER]}>
                            <Events />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="events/:id"
                        element={
                          <RoleRoute allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.USER]}>
                            <EventDetail />
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
                      <Route
                        path="profile"
                        element={
                          <RoleRoute allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.USER]}>
                            <ProfilePage />
                          </RoleRoute>
                        }
                      />
                      <Route
                        path="leaderboard"
                        element={
                          <RoleRoute allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.USER]}>
                            <Leaderboard />
                          </RoleRoute>
                        }
                      />
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
                </SelectedEventProvider>
              </ActiveEventProvider>
            </AuthProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;
