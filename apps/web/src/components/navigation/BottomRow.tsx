import { Box } from '@demonicka/ui';
import { useAuth } from '../../contexts/AuthContext';
import { NavigationLinks } from './NavigationLinks';
import { SystemLinks } from './SystemLinks';

export function BottomRow() {
  const { user } = useAuth();

  // Only show bottom row if user is logged in
  if (!user) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Left: Navigation Links */}
      <Box sx={{ pl: 3 }}>
        <NavigationLinks />
      </Box>

      {/* Right: System Links (SUPER_ADMIN only) */}
      <Box sx={{ pr: 3 }}>
        <SystemLinks />
      </Box>
    </Box>
  );
}
