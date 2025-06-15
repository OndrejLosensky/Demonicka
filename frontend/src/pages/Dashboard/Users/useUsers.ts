import { useState, useCallback, useEffect } from 'react';
import { userService } from '../../../services/userService';
import type { User } from '../../../types/user';
import { useSelectedEvent } from '../../../contexts/SelectedEventContext';
import { useToast } from '../../../hooks/useToast';
import translations from '../../../locales/cs/dashboard.users.json';
import toastTranslations from '../../../locales/cs/toasts.json';

export const useUsers = (includeDeleted = false) => {
  const [users, setUsers] = useState<User[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedEvent } = useSelectedEvent();
  const toast = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (selectedEvent) {
        // Get users for the selected event
        const eventUsers = await userService.getByEvent(selectedEvent.id);
        setUsers(eventUsers);
        setDeletedUsers([]);
      } else {
        // Fallback to all users if no event is selected
        if (includeDeleted) {
          const data = await userService.getAllUsers(true);
          const active = data.filter(u => !u.deletedAt);
          const deleted = data.filter(u => u.deletedAt);
          setUsers(active);
          setDeletedUsers(deleted);
        } else {
          const data = await userService.getAllUsers(false);
          setUsers(data);
          setDeletedUsers([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error(toastTranslations.error.fetch.replace('{{item}}', 'uživatele'));
    } finally {
      setIsLoading(false);
    }
  }, [includeDeleted, selectedEvent?.id, selectedEvent?.updatedAt, toast]);

  const handleDelete = async (userId: string) => {
    try {
      await userService.deleteUser(userId);
      await fetchUsers();
      toast.success(toastTranslations.success.deleted.replace('{{item}}', 'Uživatel'));
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error(toastTranslations.error.delete.replace('{{item}}', 'uživatele'));
    }
  };

  const handleAddBeer = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    try {
      await userService.addBeer(userId);
      await fetchUsers();
      toast.success(toastTranslations.success.beerAdded.replace('{{user}}', user?.name || userId));
    } catch (error) {
      console.error('Failed to add beer:', error);
      toast.error(translations.errors.addBeerFailed);
    }
  };

  const handleRemoveBeer = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    try {
      await userService.removeBeer(userId);
      await fetchUsers();
      toast.success(toastTranslations.success.beerRemoved.replace('{{user}}', user?.name || userId));
    } catch (error) {
      console.error('Failed to remove beer:', error);
      toast.error(translations.errors.removeBeerFailed);
    }
  };

  const handleCleanup = async () => {
    try {
      await userService.cleanup();
      await fetchUsers();
      toast.success(toastTranslations.success.deleted.replace('{{item}}', 'Smazaní uživatelé'));
    } catch (error) {
      console.error('Failed to cleanup users:', error);
      toast.error(toastTranslations.error.delete.replace('{{item}}', 'smazané uživatele'));
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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