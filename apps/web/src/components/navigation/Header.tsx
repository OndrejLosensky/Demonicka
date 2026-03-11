import { Outlet, useLocation } from 'react-router-dom';
import { Box } from '@demonicka/ui';
import { motion } from 'framer-motion';
import { useAppTheme } from '../../contexts/ThemeContext';
import { useHeaderVisibility } from '../../contexts/HeaderVisibilityContext';
import { TopRow } from './TopRow';
import { BottomRow } from './BottomRow';
import { LandingHeader } from './LandingHeader';
import { tokens } from '../../theme/tokens';
import { getShadow, getDividerColor, getBackgroundWithOpacity } from '../../theme/utils';
import { AppContainer } from '../layout/AppContainer';

export default function Header() {
  const { mode } = useAppTheme();
  const { isHeaderVisible } = useHeaderVisibility();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const showNav = isLandingPage || isHeaderVisible;

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      {showNav && (
        <motion.nav
          initial={isLandingPage ? false : { y: -100 }}
          animate={{ y: 0 }}
          style={{
            position: 'fixed',
            width: '100%',
            top: 0,
            zIndex: tokens.zIndex.header,
            ...(isLandingPage
              ? {
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: `blur(${tokens.blur.md})`,
                  boxShadow: tokens.shadows.sm,
                  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                }
              : {
                  backgroundColor: getBackgroundWithOpacity(
                    mode === 'dark' ? '#0d1117' : '#fafafa'
                  ),
                  backdropFilter: `blur(${tokens.blur.md})`,
                  boxShadow: getShadow('md', mode),
                  borderBottom: `1px solid ${getDividerColor(mode)}`,
                }),
            transition: tokens.transitions.slow,
          }}
        >
          {isLandingPage ? (
            <LandingHeader />
          ) : (
            <AppContainer>
              <TopRow />
              <BottomRow />
            </AppContainer>
          )}
        </motion.nav>
      )}

      <Box
        component="main"
        sx={{
          pt: showNav ? (isLandingPage ? 14 : { xs: 12, md: 18 }) : 0,
          minHeight: '100vh',
          ...(isLandingPage ? {} : { width: '100%' }),
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
