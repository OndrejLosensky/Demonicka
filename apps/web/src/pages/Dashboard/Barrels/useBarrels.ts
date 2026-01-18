import { useState, useCallback, useEffect, useRef } from 'react';
import { barrelService } from '../../../services/barrelService';
import type { Barrel } from '@demonicka/shared-types';
import { useToast } from '../../../hooks/useToast';
import toastTranslations from '../../../locales/cs/toasts.json';

const LOW_BEER_THRESHOLD = 10;
const ALMOST_EMPTY_THRESHOLD = 5;

export const useBarrels = (includeDeleted = false, eventId?: string) => {
  const [barrels, setBarrels] = useState<Barrel[]>([]);
  const [deletedBarrels, setDeletedBarrels] = useState<Barrel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  
  // Use refs to maintain stable references to mutable data
  const barrelsRef = useRef<Barrel[]>([]);
  const deletedBarrelsRef = useRef<Barrel[]>([]);

  const checkBarrelWarnings = useCallback((barrel: Barrel) => {
    if (!barrel.isActive) return;
    
    if (barrel.remainingBeers <= ALMOST_EMPTY_THRESHOLD) {
      toast.warning(
        toastTranslations.warning.almostEmpty.replace('{{barrel}}', `#${barrel.orderNumber}`)
      );
    } else if (barrel.remainingBeers <= LOW_BEER_THRESHOLD) {
      toast.warning(
        toastTranslations.warning.lowBeers
          .replace('{{barrel}}', `#${barrel.orderNumber}`)
          .replace('{{count}}', barrel.remainingBeers.toString())
      );
    }
  }, [toast]);

  const fetchBarrels = useCallback(async () => {
    try {
      setIsLoading(true);
      // If eventId is provided, fetch event-specific barrels, otherwise fetch all barrels
      const data = eventId 
        ? await barrelService.getByEvent(eventId)
        : await barrelService.getAll(includeDeleted);
      
      if (includeDeleted) {
        const active = data.filter(b => !b.deletedAt);
        const deleted = data.filter(b => b.deletedAt);
        setBarrels(active);
        setDeletedBarrels(deleted);
        barrelsRef.current = active;
        deletedBarrelsRef.current = deleted;
        // Check warnings only for active barrels
        active.forEach(checkBarrelWarnings);
      } else {
        setBarrels(data);
        setDeletedBarrels([]);
        barrelsRef.current = data;
        deletedBarrelsRef.current = [];
        data.forEach(checkBarrelWarnings);
      }
    } catch (error) {
      console.error('Failed to fetch barrels:', error);
      toast.error(toastTranslations.error.fetch.replace('{{item}}', 'sudy'));
    } finally {
      setIsLoading(false);
    }
  }, [includeDeleted, eventId, checkBarrelWarnings, toast]);

  const handleDelete = useCallback(async (id: string) => {
    const barrel = barrelsRef.current.find(b => b.id === id);
    try {
      await barrelService.delete(id);
      toast.success(toastTranslations.success.deleted.replace('{{item}}', `Sud #${barrel?.orderNumber || id}`));
      await fetchBarrels();
    } catch (error) {
      console.error('Failed to delete barrel:', error);
      toast.error(toastTranslations.error.delete.replace('{{item}}', 'sud'));
    }
  }, [fetchBarrels, toast]);

  const handleToggleActive = useCallback(async (id: string) => {
    const barrel = barrelsRef.current.find(b => b.id === id);
    try {
      await barrelService.activate(id);
      toast.success(toastTranslations.success.updated.replace('{{item}}', `Sud #${barrel?.orderNumber || id}`));
      await fetchBarrels();
    } catch (error) {
      console.error('Failed to update barrel status:', error);
      toast.error(toastTranslations.error.update.replace('{{item}}', 'sud'));
    }
  }, [fetchBarrels, toast]);

  const handleCleanup = useCallback(async () => {
    try {
      await barrelService.cleanup();
      toast.success(toastTranslations.success.deleted.replace('{{item}}', 'Smazané sudy'));
      await fetchBarrels();
    } catch (error) {
      console.error('Failed to cleanup barrels:', error);
      toast.error(toastTranslations.error.delete.replace('{{item}}', 'smazané sudy'));
    }
  }, [fetchBarrels, toast]);

  // Fetch when includeDeleted or eventId changes
  useEffect(() => {
    fetchBarrels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeDeleted, eventId]); // fetchBarrels is stable via useCallback with these deps

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