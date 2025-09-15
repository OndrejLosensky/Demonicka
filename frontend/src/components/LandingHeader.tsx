import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box, 
  Button,
  Tooltip
} from '@mui/material';
import { 
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useAppTheme } from '../contexts/ThemeContext';

export default function LandingHeader() {
  const { user } = useAuth();
  const { mode, toggleMode } = useAppTheme();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: 1100,
        }}
      >
        <Toolbar sx={{ 
          minHeight: 64,
          px: { xs: 2, sm: 3 },
          justifyContent: 'space-between'
        }}>
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center"
          >
            <Link
              to="/"
              className="text-2xl font-bold text-primary flex items-center gap-2 relative"
            >
              <img
                src="/logo.svg"
                alt="Démonická"
                className="h-8 w-auto"
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
                className="absolute -right-2 -top-2 bg-primary text-white rounded-full px-2 py-1 text-xs font-semibold transform rotate-12 shadow-lg"
              >
                v2.0
              </motion.div>
            </Link>
          </motion.div>

          {/* Right Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Theme Toggle */}
            <Tooltip title={`Přepnout na ${mode === 'light' ? 'tmavý' : 'světlý'} režim`} arrow>
              <IconButton
                onClick={toggleMode}
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: 'action.hover'
                  }
                }}
              >
                {mode === 'light' ? (
                  <DarkModeIcon fontSize="small" />
                ) : (
                  <LightModeIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>

            {/* Dashboard Link */}
            {user && (
              <Tooltip title="Dashboard" arrow>
                <IconButton
                  onClick={() => navigate('/dashboard')}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <DashboardIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {/* Login/User Button */}
            {user ? (
              <Tooltip title={`Profil - ${user.username}`} arrow>
                <IconButton
                  onClick={() => navigate('/profile')}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <PersonIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Button
                component={Link}
                to="/login"
                variant="contained"
                size="small"
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark'
                  }
                }}
              >
                Přihlásit se
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </motion.div>
  );
}
