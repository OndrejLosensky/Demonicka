import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { userService } from '../../../services/userService';
import type { User } from '../../../types/user';
import { useSelectedEvent } from '../../../contexts/SelectedEventContext';
import translations from '../../../locales/cs/dashboard.users.json';

export const useUsers = (includeDeleted = false) => {
  const [users, setUsers] = useState<User[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedEvent } = useSelectedEvent();

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
    } catch (error: unknown) {
      console.error('Failed to fetch users:', error);
      toast.error(translations.errors.fetchFailed);
    } finally {
      setIsLoading(false);
    }
  }, [includeDeleted, selectedEvent?.id, selectedEvent?.updatedAt]);

  const handleDelete = async (userId: string) => {
    try {
      await userService.deleteUser(userId);
      await fetchUsers();
      toast.success(translations.actions.deleteSuccess);
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error(translations.errors.deleteFailed);
    }
  };

  const handleAddBeer = async (userId: string) => {
    try {
      await userService.addBeer(userId);
      await fetchUsers();
      toast.success(translations.actions.addBeerSuccess);
    } catch (error) {
      console.error('Failed to add beer:', error);
      toast.error(translations.errors.addBeerFailed);
    }
  };

  const handleRemoveBeer = async (userId: string) => {
    try {
      await userService.removeBeer(userId);
      await fetchUsers();
      toast.success(translations.actions.removeBeerSuccess);
    } catch (error) {
      console.error('Failed to remove beer:', error);
      toast.error(translations.errors.removeBeerFailed);
    }
  };

  const handleCleanup = async () => {
    try {
      await userService.cleanup();
      await fetchUsers();
      toast.success(translations.actions.cleanupSuccess);
    } catch (error) {
      console.error('Failed to cleanup users:', error);
      toast.error(translations.errors.cleanupFailed);
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