import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box } from '@mui/material';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Box>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="shrink-0 flex items-center">
                  <Link to="/" className="text-xl font-bold text-primary-600">
                    Démonická
                  </Link>
                </div>
                {user && (
                  <div className="ml-10 flex items-center space-x-4">
                    <Link
                      to="/dashboard"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/dashboard')
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/dashboard/ucastnici"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/dashboard/ucastnici')
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      Participants
                    </Link>
                    <Link
                      to="/dashboard/sudy"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/dashboard/sudy')
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      Barrels
                    </Link>
                  </div>
                )}
              </div>
              <div className="flex items-center">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Logout
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </Box>
  );
};

export default Header; 