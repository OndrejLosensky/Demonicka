import { useState } from 'react';
import { IconButton, Avatar, Tooltip, Box, Typography } from '@demonicka/ui';
import { useAuth } from '../../contexts/AuthContext';
import { tokens } from '../../theme/tokens';
import { USER_ROLE } from '@demonicka/shared-types';
import { UserProfileMenu } from './UserProfileMenu';
import translations from '../../locales/cs/common.header.json';

export function UserInfo() {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (!user) return null;

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const getRoleLabel = () => {
    switch (user.role) {
      case USER_ROLE.SUPER_ADMIN:
        return 'Super Admin';
      case USER_ROLE.OPERATOR:
        return 'Operátor';
      case USER_ROLE.USER:
        return 'Uživatel';
      default:
        return 'Účastník';
    }
  };

  return (
    <>
      <Tooltip
        title={`${translations.auth.profile} - ${user.username}`}
        arrow
        placement="bottom"
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            px: 1,
            py: 0.5,
            borderRadius: tokens.borderRadius.xs,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
          onClick={handleOpenMenu}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.main',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            {user.username.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
              {user.username}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
              {getRoleLabel()}
            </Typography>
          </Box>
        </Box>
      </Tooltip>
      <UserProfileMenu anchorEl={anchorEl} onClose={handleCloseMenu} />
    </>
  );
}
