import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { barrelsApi } from './api';
import type { Barrel, UseBarrelsReturn } from './types';

export const useBarrels = (): UseBarrelsReturn => {
  const [barrels, setBarrels] = useState<Barrel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBarrels = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await barrelsApi.getAll();
      setBarrels(data);
    } catch (error: unknown) {
      console.error('Failed to fetch barrels:', error);
      toast.error('Failed to fetch barrels');
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const handleToggleActive = useCallback(async (id: string, isActive: boolean) => {
    try {
      await barrelsApi.update(id, { isActive });
      toast.success(`Barrel ${isActive ? 'activated' : 'deactivated'}`);
      await fetchBarrels();
    } catch (error: unknown) {
      console.error('Failed to update barrel:', error);
      toast.error('Failed to update barrel');
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
    isLoading,
    handleDelete,
    handleToggleActive,
    handleCleanup,
    fetchBarrels,
  };
}; 