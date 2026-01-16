import { Outlet, useLocation } from 'react-router-dom';
import { Box } from '@demonicka/ui';
import { motion } from 'framer-motion';
import { useAppTheme } from '../../contexts/ThemeContext';
import { useHeaderVisibility } from '../../contexts/HeaderVisibilityContext';
import { TopRow } from './TopRow';
import { BottomRow } from './BottomRow';

export default function Header() {
  const { mode } = useAppTheme();
  const { isHeaderVisible } = useHeaderVisibility();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      {isHeaderVisible && (
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          style={{
            position: 'fixed',
            width: '100%',
            top: 0,
            zIndex: 50,
            backgroundColor: mode === 'dark' ? 'rgba(13, 17, 23, 0.95)' : 'rgba(250, 250, 250, 0.95)',
            backdropFilter: 'blur(8px)',
            boxShadow: mode === 'dark' ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
            transition: 'all 0.3s ease',
          }}
        >
          <Box
            sx={{
              maxWidth: '1280px',
              mx: 'auto',
              width: '100%',
              px: { xs: 2, sm: 3, md: 4 },
            }}
          >
            <TopRow />
            <BottomRow />
          </Box>
        </motion.nav>
      )}

      <Box
        component="main"
        sx={{
          pt: isHeaderVisible ? { xs: 12, md: 18 } : 0,
          minHeight: '100vh',
          ...(isLandingPage ? {} : { maxWidth: '1280px', mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: 3 }),
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
