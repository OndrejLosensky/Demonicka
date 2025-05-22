import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function Header() {
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
    <div>
      <div className={`min-h-screen ${isLandingPage ? '' : 'bg-background-secondary'}`}>
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className={`fixed w-full z-50 transition-all duration-300 ${
            isScrolled || !isLandingPage
              ? 'bg-background-primary/95 backdrop-blur-sm shadow-sm'
              : 'bg-background-secondary/80 backdrop-blur-sm'
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
                    className="text-2xl font-bold text-primary"
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
                          ? 'bg-primary text-white'
                          : 'text-text-primary hover:text-text-secondary'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/dashboard/ucastnici"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/dashboard/ucastnici')
                          ? 'bg-primary text-white'
                          : 'text-text-primary hover:text-text-secondary'
                      }`}
                    >
                      Participants
                    </Link>
                    <Link
                      to="/dashboard/sudy"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/dashboard/sudy')
                          ? 'bg-primary text-white'
                          : 'text-text-primary hover:text-text-secondary'
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
                      ? 'bg-primary text-white'
                      : 'text-text-primary hover:text-text-secondary'
                  }`}
                >
                  Leaderboard
                </Link>
                {user ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary-hover"
                  >
                    Logout
                  </motion.button>
                ) : (
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Link
                      to="/login"
                      className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary-hover"
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
    </div>
  );
} 