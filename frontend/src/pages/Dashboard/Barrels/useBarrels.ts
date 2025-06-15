import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { barrelService } from '../../../services/barrelService';
import type { Barrel } from '../../../types/barrel';
import { useSelectedEvent } from '../../../contexts/SelectedEventContext';
import translations from '../../../locales/cs/dashboard.barrels.json';

export const useBarrels = (includeDeleted = false) => {
  const [barrels, setBarrels] = useState<Barrel[]>([]);
  const [deletedBarrels, setDeletedBarrels] = useState<Barrel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedEvent } = useSelectedEvent();

  const fetchBarrels = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (selectedEvent) {
        // Get barrels for the selected event
        const eventBarrels = await barrelService.getByEvent(selectedEvent.id);
        setBarrels(eventBarrels);
        setDeletedBarrels([]);
      } else {
        // Fallback to all barrels if no event is selected
        if (includeDeleted) {
          const data = await barrelService.getAll(true);
          const active = data.filter(b => !b.deletedAt);
          const deleted = data.filter(b => b.deletedAt);
          setBarrels(active);
          setDeletedBarrels(deleted);
        } else {
          const data = await barrelService.getAll(false);
          setBarrels(data);
          setDeletedBarrels([]);
        }
      }
    } catch (error: unknown) {
      console.error('Failed to fetch barrels:', error);
      toast.error(translations.errors.fetchFailed);
    } finally {
      setIsLoading(false);
    }
  }, [includeDeleted, selectedEvent]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await barrelService.delete(id);
      toast.success(translations.dialogs.delete.success);
      await fetchBarrels();
    } catch (error: unknown) {
      console.error('Failed to delete barrel:', error);
      toast.error(translations.dialogs.delete.error);
    }
  }, [fetchBarrels]);

  const handleToggleActive = useCallback(async (id: string) => {
    try {
      await barrelService.toggleActive(id);
      toast.success(translations.errors.statusUpdated);
      await fetchBarrels();
    } catch (error: unknown) {
      console.error('Failed to update barrel status:', error);
      toast.error(translations.errors.toggleStatusFailed);
    }
  }, [fetchBarrels]);

  const handleCleanup = useCallback(async () => {
    try {
      await barrelService.cleanup();
      toast.success(translations.dialogs.cleanupAll.success);
      await fetchBarrels();
    } catch (error: unknown) {
      console.error('Failed to cleanup barrels:', error);
      toast.error(translations.dialogs.cleanupAll.error);
    }
  }, [fetchBarrels]);

  useEffect(() => {
    fetchBarrels();
  }, [fetchBarrels]);

  return {
    barrels,
    deletedBarrels,
    isLoading,
    handleDelete,
    handleToggleActive,
    handleCleanup,
    fetchBarrels,
  };
}; 