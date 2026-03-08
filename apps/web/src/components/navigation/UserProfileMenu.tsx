import { useNavigate } from 'react-router-dom';
import { Menu, MenuItem, ListItemIcon, ListItemText, Divider, Box, Typography } from '@demonicka/ui';
import { Logout as LogoutIcon, Person as PersonIcon, TrendingUp as TrendingUpIcon, EmojiEvents as EmojiEventsIcon, Settings as SettingsIcon } from '@demonicka/ui';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useAuth } from '../../contexts/AuthContext';
import { tokens } from '../../theme/tokens';
import { getShadow } from '../../theme/utils';
import { useAppTheme } from '../../contexts/ThemeContext';
import { USER_ROLE } from '@demonicka/shared-types';
import { useTranslations } from '../../contexts/LocaleContext';

interface UserProfileMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

export function UserProfileMenu({ anchorEl, onClose }: UserProfileMenuProps) {
  const { user, logout, hasRole } = useAuth();
  const { mode } = useAppTheme();
  const navigate = useNavigate();
  const t = useTranslations<{ auth: Record<string, string>; navigation: Record<string, string> }>('common.header');

  if (!user) return null;

  const userBase = `/u/${encodeURIComponent(user.username)}`;

  const handleProfileClick = () => {
    onClose();
    if (hasRole([USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR, USER_ROLE.USER])) {
      navigate(`/u/${encodeURIComponent(user.id)}/profile`);
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
    navigate(`${userBase}/dashboard`);
  };

  const handleAchievementsClick = () => {
    onClose();
    navigate(`${userBase}/achievements`);
  };

  const handleSettingsClick = () => {
    onClose();
    navigate(`${userBase}/settings`);
  };

  const handleDocsClick = () => {
    onClose();
    navigate('/dashboard/docs');
  };

  const handleFeedbackClick = () => {
    onClose();
    navigate('/dashboard/feedback');
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
          filter: getShadow('dropShadow', mode),
          mt: 1.5,
          minWidth: 200,
          borderRadius: 1,
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
            boxShadow: getShadow('sm', mode),
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
          primary={t.auth?.profile}
          primaryTypographyProps={{
            sx: { fontWeight: 500 },
          }}
        />
      </MenuItem>
      <MenuItem onClick={handleFeedbackClick} sx={{ py: 1, px: 2 }}>
        <ListItemIcon>
          <RateReviewOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary={t.auth?.feedback}
          primaryTypographyProps={{
            sx: { fontWeight: 500 },
          }}
        />
      </MenuItem>
      {hasRole([USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATOR, USER_ROLE.USER]) && [
        <MenuItem key="stats" onClick={handlePersonalStatsClick} sx={{ py: 1, px: 2 }}>
          <ListItemIcon>
            <TrendingUpIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={t.navigation?.myStats}
            primaryTypographyProps={{
              sx: { fontWeight: 500 },
            }}
          />
        </MenuItem>,
        <MenuItem key="settings" onClick={handleSettingsClick} sx={{ py: 1, px: 2 }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={t.navigation?.settings}
            primaryTypographyProps={{
              sx: { fontWeight: 500 },
            }}
          />
        </MenuItem>,
        <MenuItem key="achievements" onClick={handleAchievementsClick} sx={{ py: 1, px: 2 }}>
          <ListItemIcon>
            <EmojiEventsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={t.navigation?.achievements}
            primaryTypographyProps={{
              sx: { fontWeight: 500 },
            }}
          />
        </MenuItem>,
      ]}
      {hasRole([USER_ROLE.SUPER_ADMIN]) && (
        <MenuItem onClick={handleDocsClick} sx={{ py: 1, px: 2 }}>
          <ListItemIcon>
            <MenuBookIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={t.navigation?.docs}
            primaryTypographyProps={{
              sx: { fontWeight: 500 },
            }}
          />
        </MenuItem>
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
          primary={t.auth?.logout}
          primaryTypographyProps={{
            sx: { fontWeight: 500, color: 'error.main' },
          }}
        />
      </MenuItem>
    </Menu>
  );
}
