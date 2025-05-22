import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { barrelsApi } from './api';
import type { Barrel } from './types';

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
      toast.error('Failed to fetch barrels');
    } finally {
      setIsLoading(false);
    }
  }, [includeDeleted]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await barrelsApi.delete(id);
      toast.success('Barrel deleted');
      await fetchBarrels();
    } catch (error: unknown) {
      console.error('Failed to delete barrel:', error);
      toast.error('Failed to delete barrel');
    }
  }, [fetchBarrels]);

  const handleToggleActive = useCallback(async (id: string) => {
    try {
      await barrelsApi.toggleActive(id);
      toast.success('Barrel status updated');
      await fetchBarrels();
    } catch (error: unknown) {
      console.error('Failed to update barrel status:', error);
      toast.error('Failed to update barrel status');
    }
  }, [fetchBarrels]);

  const handleCleanup = useCallback(async () => {
    try {
      await barrelsApi.cleanup();
      toast.success('All barrels cleaned up');
      await fetchBarrels();
    } catch (error: unknown) {
      console.error('Failed to cleanup barrels:', error);
      toast.error('Failed to cleanup barrels');
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