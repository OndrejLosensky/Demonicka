import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Button,
} from '@demonicka/ui';
import { Badge } from '@mui/material';
import { SportsBar as SportsBarIcon, Event as EventIcon, Settings as SettingsIcon } from '@demonicka/ui';
import { formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useAppTheme } from '../../contexts/ThemeContext';
import { getShadow } from '../../theme/utils';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../contexts/AuthContext';
import type { NotificationItem } from '../../services/notificationService';
import notificationTranslations from '../../locales/cs/notifications.json';

interface NotificationMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

function getNotificationMessage(notification: NotificationItem): string {
  const t = notificationTranslations as Record<string, string>;
  const template = t[notification.type] ?? notification.type;
  const payload = notification.payload as Record<string, string | undefined>;
  const actorName = payload.actorName ?? t.unknownActor ?? 'Někdo';
  const eventName = payload.eventName ?? 'Událost';
  return template
    .replace(/\{\{actorName\}\}/g, actorName)
    .replace(/\{\{eventName\}\}/g, eventName);
}

function getNotificationIcon(type: string) {
  if (type === 'BEER_ADDED' || type === 'BEER_REMOVED') {
    return <SportsBarIcon fontSize="small" />;
  }
  return <EventIcon fontSize="small" />;
}

function formatTime(createdAt: string): string {
  try {
    return formatDistanceToNow(new Date(createdAt), {
      addSuffix: true,
      locale: cs,
    });
  } catch {
    return '';
  }
}

export function NotificationMenu({ anchorEl, onClose }: NotificationMenuProps) {
  const { mode } = useAppTheme();
  const navigate = useNavigate();
  const {
    unreadCount,
    notifications,
    loadingList,
    refetchList,
    markRead,
    markAllRead,
  } = useNotifications();
  const { user } = useAuth();

  useEffect(() => {
    if (anchorEl) {
      void refetchList();
    }
  }, [anchorEl, refetchList]);

  const handleItemClick = async (notification: NotificationItem) => {
    if (!notification.readAt) {
      await markRead(notification.id);
    }
    const eventId = (notification.payload as Record<string, string>)?.eventId;
    if (eventId) {
      onClose();
      navigate(`/dashboard/events/${eventId}`);
    }
  };

  const title = notificationTranslations.title ?? 'Oznámení';
  const markAllReadLabel = notificationTranslations.markAllRead ?? 'Označit vše jako přečtené';
  const emptyLabel = notificationTranslations.empty ?? 'Žádná oznámení';

  return (
    <Menu
      anchorEl={anchorEl}
      open={!!anchorEl}
      onClose={onClose}
      PaperProps={{
        elevation: 8,
        sx: {
          overflow: 'visible',
          filter: getShadow('dropShadow', mode),
          mt: 1.5,
          minWidth: 320,
          maxWidth: 380,
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
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {unreadCount > 0 && (
          <Button
            size="small"
            variant="text"
            onClick={() => void markAllRead()}
            sx={{ textTransform: 'none', minWidth: 0 }}
          >
            {markAllReadLabel}
          </Button>
        )}
      </Box>
      <Divider sx={{ opacity: 0.6 }} />
      <Box sx={{ maxHeight: 360, overflow: 'auto' }}>
        {loadingList ? (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Načítám…
            </Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {emptyLabel}
            </Typography>
          </Box>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => void handleItemClick(notification)}
              sx={{
                py: 1.5,
                px: 2,
                gap: 1.5,
                bgcolor: notification.readAt ? undefined : 'action.hover',
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {getNotificationIcon(notification.type)}
              </ListItemIcon>
              <ListItemText
                primary={getNotificationMessage(notification)}
                primaryTypographyProps={{ variant: 'body2', fontWeight: notification.readAt ? 400 : 500 }}
                secondary={formatTime(notification.createdAt)}
                secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
              />
              {!notification.readAt && (
                <Badge
                  variant="dot"
                  color="primary"
                  sx={{ ml: 0.5, '& .MuiBadge-dot': { transform: 'none' } }}
                />
              )}
            </MenuItem>
          ))
        )}
      </Box>
      {user?.username && (
        <>
          <Divider sx={{ opacity: 0.6 }} />
          <MenuItem
            onClick={() => {
              onClose();
              navigate(`/u/${encodeURIComponent(user.username)}/settings`);
            }}
            sx={{ py: 1, px: 2 }}
          >
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={(notificationTranslations as Record<string, string>).settings ?? 'Nastavení oznámení'}
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </MenuItem>
        </>
      )}
    </Menu>
  );
}
