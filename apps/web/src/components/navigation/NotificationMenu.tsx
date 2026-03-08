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
import { cs, enUS } from 'date-fns/locale';
import { useAppTheme } from '../../contexts/ThemeContext';
import { getShadow } from '../../theme/utils';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale, useTranslations } from '../../contexts/LocaleContext';
import type { NotificationItem } from '../../services/notificationService';

interface NotificationMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

function getNotificationMessage(
  notification: NotificationItem,
  t: Record<string, string>,
): string {
  const template = t[notification.type] ?? notification.type;
  const payload = notification.payload as Record<string, string | undefined>;
  const actorName = payload.actorName ?? t.unknownActor ?? 'Someone';
  const eventName = payload.eventName ?? 'Event';
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

function formatTime(createdAt: string, locale: 'cs' | 'en'): string {
  try {
    return formatDistanceToNow(new Date(createdAt), {
      addSuffix: true,
      locale: locale === 'en' ? enUS : cs,
    });
  } catch {
    return '';
  }
}

export function NotificationMenu({ anchorEl, onClose }: NotificationMenuProps) {
  const { mode } = useAppTheme();
  const { locale } = useLocale();
  const notificationT = useTranslations<Record<string, string>>('notifications');
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

  const title = notificationT.title ?? 'Notifications';
  const markAllReadLabel = notificationT.markAllRead ?? 'Mark all as read';
  const emptyLabel = notificationT.empty ?? 'No notifications';
  const loadingLabel = notificationT.loading ?? 'Loading…';
  const settingsLabel = notificationT.settings ?? 'Notification settings';

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
              {loadingLabel}
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
                primary={getNotificationMessage(notification, notificationT)}
                primaryTypographyProps={{ variant: 'body2', fontWeight: notification.readAt ? 400 : 500 }}
                secondary={formatTime(notification.createdAt, locale)}
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
              primary={settingsLabel}
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </MenuItem>
        </>
      )}
    </Menu>
  );
}
