import type { SxProps, Theme } from '@mui/material/styles';
import { Box } from '@demonicka/ui';
import { tokens } from '../../theme/tokens';

type Props = {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
};

/**
 * Single source of truth for app-wide container width + horizontal padding.
 * Used by Header (TopRow/BottomRow), DashboardLayout (breadcrumbs + pages), etc.
 */
export function AppContainer({ children, sx }: Props) {
  return (
    <Box
      sx={[
        {
          maxWidth: tokens.maxWidth.container,
          mx: 'auto',
          width: '100%',
          px: { xs: 2, sm: 3, md: 4 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}

