import { useNavigate } from 'react-router-dom';
import { Menu, MenuItem, ListItemIcon, ListItemText, Divider, Box, Typography } from '@demonicka/ui';
import { Logout as LogoutIcon, Person as PersonIcon, TrendingUp as TrendingUpIcon, EmojiEvents as EmojiEventsIcon } from '@demonicka/ui';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLE } from '@demonicka/shared-types';
import translations from '../../locales/cs/common.header.json';

interface UserProfileMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

export function UserProfileMenu({ anchorEl, onClose }: UserProfileMenuProps) {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleProfileClick = () => {
    onClose();
    if (hasRole([USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR, USER_ROLE.USER])) {
      navigate('/profile');
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login');
  };

  const handlePersonalStatsClick = () => {
    onClose();
    navigate(`/${user.id}/dashboard`);
  };

  const handleAchievementsClick = () => {
    onClose();
    navigate('/achievements');
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
    <Menu
      anchorEl={anchorEl}
      open={!!anchorEl}
      onClose={onClose}
      onClick={onClose}
      PaperProps={{
        elevation: 8,
        sx: {
          overflow: 'visible',
          filter: 'drop-shadow(0px 8px 24px rgba(0,0,0,0.12))',
          mt: 1.5,
          minWidth: 200,
          borderRadius: 2,
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: 'background.paper',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
            boxShadow: '0px -2px 4px rgba(0,0,0,0.06)',
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {user.username}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {getRoleLabel()}
        </Typography>
      </Box>
      <Divider sx={{ opacity: 0.6 }} />
      <MenuItem onClick={handleProfileClick} sx={{ py: 1, px: 2 }}>
        <ListItemIcon>
          <PersonIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary={translations.auth.profile}
          primaryTypographyProps={{
            sx: { fontWeight: 500 },
          }}
        />
      </MenuItem>
      {hasRole([USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR]) && (
        <>
          <MenuItem onClick={handlePersonalStatsClick} sx={{ py: 1, px: 2 }}>
            <ListItemIcon>
              <TrendingUpIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Moje statistiky"
              primaryTypographyProps={{
                sx: { fontWeight: 500 },
              }}
            />
          </MenuItem>
          <MenuItem onClick={handleAchievementsClick} sx={{ py: 1, px: 2 }}>
            <ListItemIcon>
              <EmojiEventsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Úspěchy"
              primaryTypographyProps={{
                sx: { fontWeight: 500 },
              }}
            />
          </MenuItem>
        </>
      )}
      <Divider sx={{ opacity: 0.6 }} />
      <MenuItem
        onClick={handleLogout}
        sx={{
          py: 1,
          px: 2,
          color: 'error.main',
          '&:hover': {
            bgcolor: 'error.light',
            color: 'error.dark',
          },
        }}
      >
        <ListItemIcon>
          <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
        </ListItemIcon>
        <ListItemText
          primary={translations.auth.logout}
          primaryTypographyProps={{
            sx: { fontWeight: 500, color: 'error.main' },
          }}
        />
      </MenuItem>
    </Menu>
  );
}
