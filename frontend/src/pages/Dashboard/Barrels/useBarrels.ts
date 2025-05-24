import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { barrelsApi } from './api';
import type { Barrel } from './types';
import translations from '../../../locales/cs/dashboard.barrels.json';

export const useBarrels = (includeDeleted = false) => {
  const [barrels, setBarrels] = useState<Barrel[]>([]);
  const [deletedBarrels, setDeletedBarrels] = useState<Barrel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBarrels = useCallback(async () => {
    try {
      setIsLoading(true);
      const [active, deleted] = await Promise.all([
        barrelsApi.getAll(includeDeleted),
        includeDeleted ? barrelsApi.getDeleted() : Promise.resolve([]),
      ]);
      setBarrels(active);
      setDeletedBarrels(deleted);
    } catch (error: unknown) {
      console.error('Failed to fetch barrels:', error);
      toast.error(translations.errors.fetchFailed);
    } finally {
      setIsLoading(false);
    }
  }, [includeDeleted]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await barrelsApi.delete(id);
      toast.success(translations.dialogs.delete.success);
      await fetchBarrels();
    } catch (error: unknown) {
      console.error('Failed to delete barrel:', error);
      toast.error(translations.dialogs.delete.error);
    }
  }, [fetchBarrels]);

  const handleToggleActive = useCallback(async (id: string) => {
    try {
      await barrelsApi.toggleActive(id);
      toast.success(translations.errors.statusUpdated);
      await fetchBarrels();
    } catch (error: unknown) {
      console.error('Failed to update barrel status:', error);
      toast.error(translations.errors.toggleStatusFailed);
    }
  }, [fetchBarrels]);

  const handleCleanup = useCallback(async () => {
    try {
      await barrelsApi.cleanup();
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