import { Outlet, useLocation } from 'react-router-dom';
import { Box } from '@demonicka/ui';
import { motion } from 'framer-motion';
import { useAppTheme } from '../../contexts/ThemeContext';
import { useHeaderVisibility } from '../../contexts/HeaderVisibilityContext';
import { TopRow } from './TopRow';
import { BottomRow } from './BottomRow';
import { tokens } from '../../theme/tokens';
import { getShadow, getDividerColor, getBackgroundWithOpacity } from '../../theme/utils';
import { AppContainer } from '../layout/AppContainer';

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
            zIndex: tokens.zIndex.header,
            backgroundColor: getBackgroundWithOpacity(
              mode === 'dark' ? '#0d1117' : '#fafafa'
            ),
            backdropFilter: `blur(${tokens.blur.md})`,
            boxShadow: getShadow('md', mode),
            borderBottom: `1px solid ${getDividerColor(mode)}`,
            transition: tokens.transitions.slow,
          }}
        >
          <AppContainer>
            <TopRow />
            <BottomRow />
          </AppContainer>
        </motion.nav>
      )}

      <Box
        component="main"
        sx={{
          pt: isHeaderVisible ? { xs: 12, md: 18 } : 0,
          minHeight: '100vh',
          // Keep main full-width; dashboard pages control their own container spacing.
          ...(isLandingPage ? {} : { width: '100%' }),
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
