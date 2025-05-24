import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Participants from './pages/Dashboard/Participants';
import Barrels from './pages/Dashboard/Barrels';
import Leaderboard from './pages/Leaderboard';
import Landing from './pages/Landing';
import Header from './components/Header';
import { History } from './pages/Dashboard/history';
import ProfilePage from './pages/Profile';

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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Header />}>
                <Route index element={<Landing />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route
                  path="dashboard"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="profile"
                  element={
                    <PrivateRoute>
                      <ProfilePage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="dashboard/ucastnici"
                  element={
                    <PrivateRoute>
                      <Participants />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="dashboard/barrels"
                  element={
                    <PrivateRoute>
                      <Barrels />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="dashboard/history"
                  element={
                    <PrivateRoute>
                      <History />
                    </PrivateRoute>
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
