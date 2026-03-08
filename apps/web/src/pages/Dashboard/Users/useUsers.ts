import { useState, useCallback, useEffect, useRef } from 'react';
import { userService } from '../../../services/userService';
import type { User } from '@demonicka/shared-types';
import { useSelectedEvent } from '../../../contexts/SelectedEventContext';
import { useToast } from '../../../hooks/useToast';
import { useTranslations } from '../../../contexts/LocaleContext';

export const useUsers = (includeDeleted = false) => {
  const [users, setUsers] = useState<User[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedEvent } = useSelectedEvent();
  const toast = useToast();
  const toastT = useTranslations<Record<string, Record<string, string>>>('toasts');
  const usersT = useTranslations<Record<string, unknown>>('dashboard.users');
  const success = toastT.success as Record<string, string> | undefined;
  const toastError = toastT.error as Record<string, string> | undefined;
  const errors = usersT.errors as Record<string, string> | undefined;
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  const fetchUsers = useCallback(async () => {
    // Clear any pending fetch
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Debounce the fetch operation
    fetchTimeoutRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;

      try {
        setIsLoading(true);
        
        if (selectedEvent) {
          // Get users for the selected event
          const eventUsers = await userService.getByEvent(selectedEvent.id);
          if (isMountedRef.current) {
            setUsers(eventUsers);
            setDeletedUsers([]);
          }
        } else {
          // Fallback to all users if no event is selected
          if (includeDeleted) {
            const data = await userService.getAllUsers(true);
            if (isMountedRef.current) {
              const active = data.filter(u => !u.deletedAt);
              const deleted = data.filter(u => u.deletedAt);
              setUsers(active);
              setDeletedUsers(deleted);
            }
          } else {
            const data = await userService.getAllUsers(false);
            if (isMountedRef.current) {
              setUsers(data);
              setDeletedUsers([]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
        if (isMountedRef.current) {
          toast.error((toastError?.fetch ?? 'Nepodařilo se načíst {{item}}').replace('{{item}}', 'uživatele'));
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }, 300); // Debounce time of 300ms
  }, [includeDeleted, selectedEvent?.id, toast, toastError]);

  const handleDelete = async (userId: string) => {
    try {
      await userService.deleteUser(userId);
      await fetchUsers();
      toast.success((success?.deleted ?? '{{item}} byl úspěšně smazán').replace('{{item}}', 'Uživatel'));
    } catch (err) {
      console.error('Failed to delete user:', err);
      toast.error((toastError?.delete ?? 'Nepodařilo se smazat {{item}}').replace('{{item}}', 'uživatele'));
    }
  };

  const handleAddBeer = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    try {
      await userService.addBeer(userId);
      await fetchUsers();
      toast.success((success?.beerAdded ?? 'Pivo bylo přidáno uživateli {{user}}').replace('{{user}}', user?.username || userId));
    } catch (err) {
      console.error('Failed to add beer:', err);
      toast.error(errors?.addBeerFailed ?? 'Nepodařilo se přidat pivo');
    }
  };

  const handleRemoveBeer = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    try {
      await userService.removeBeer(userId);
      await fetchUsers();
      toast.success((success?.beerRemoved ?? 'Pivo bylo odebráno uživateli {{user}}').replace('{{user}}', user?.username || userId));
    } catch (err) {
      console.error('Failed to remove beer:', err);
      toast.error(errors?.removeBeerFailed ?? 'Nepodařilo se odebrat pivo');
    }
  };

  const handleCleanup = async () => {
    try {
      await userService.cleanup();
      await fetchUsers();
      toast.success((success?.deleted ?? '{{item}} byl úspěšně smazán').replace('{{item}}', 'Smazaní uživatelé'));
    } catch (err) {
      console.error('Failed to cleanup users:', err);
      toast.error((toastError?.delete ?? 'Nepodařilo se smazat {{item}}').replace('{{item}}', 'smazané uživatele'));
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  return {
    users,
    deletedUsers,
    isLoading,
    handleDelete,
    handleAddBeer,
    handleRemoveBeer,
    handleCleanup,
    fetchUsers,
  };
}; 