import { useNotificationsContext } from '../contexts/NotificationsContext';

export function useNotifications() {
  return useNotificationsContext();
}
