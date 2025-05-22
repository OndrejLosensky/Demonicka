import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;
  const isLandingPage = location.pathname === '/';

  return (
    <Box>
      <div className={`min-h-screen ${isLandingPage ? '' : 'bg-gray-50'}`}>
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className={`fixed w-full z-50 transition-all duration-300 ${
            isScrolled || !isLandingPage
              ? 'bg-white shadow-md'
              : 'bg-transparent'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="shrink-0 flex items-center"
                >
                  <Link
                    to="/"
                    className={`text-xl font-bold ${
                      isScrolled || !isLandingPage
                        ? 'text-blue-600'
                        : 'text-white'
                    }`}
                  >
                    Démonická
                  </Link>
                </motion.div>
                {user && (
                  <div className="ml-10 flex items-center space-x-4">
                    <Link
                      to="/dashboard"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/dashboard')
                          ? 'bg-blue-600 text-white'
                          : isScrolled || !isLandingPage
                          ? 'text-gray-700 hover:text-gray-900'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/dashboard/ucastnici"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/dashboard/ucastnici')
                          ? 'bg-blue-600 text-white'
                          : isScrolled || !isLandingPage
                          ? 'text-gray-700 hover:text-gray-900'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      Participants
                    </Link>
                    <Link
                      to="/dashboard/sudy"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/dashboard/sudy')
                          ? 'bg-blue-600 text-white'
                          : isScrolled || !isLandingPage
                          ? 'text-gray-700 hover:text-gray-900'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      Barrels
                    </Link>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  to="/leaderboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/leaderboard')
                      ? 'bg-blue-600 text-white'
                      : isScrolled || !isLandingPage
                      ? 'text-gray-700 hover:text-gray-900'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Leaderboard
                </Link>
                {user ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={handleLogout}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      isScrolled || !isLandingPage
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-white text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    Logout
                  </motion.button>
                ) : (
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Link
                      to="/login"
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        isScrolled || !isLandingPage
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-white text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      Login
                    </Link>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.nav>
        <main className={`${isLandingPage ? '' : 'max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-20'}`}>
          <Outlet />
        </main>
      </div>
    </Box>
  );
};

export default Header; 