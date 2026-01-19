import { useState, useCallback, useEffect, useRef } from 'react';
import { barrelService } from '../../../services/barrelService';
import type { Barrel } from '@demonicka/shared-types';
import { notify } from '../../../notifications/notify';
import toastTranslations from '../../../locales/cs/toasts.json';

const LOW_BEER_THRESHOLD = 10;
const ALMOST_EMPTY_THRESHOLD = 5;

export const useBarrels = (includeDeleted = false, eventId?: string) => {
  const [barrels, setBarrels] = useState<Barrel[]>([]);
  const [deletedBarrels, setDeletedBarrels] = useState<Barrel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use refs to maintain stable references to mutable data
  const barrelsRef = useRef<Barrel[]>([]);
  const deletedBarrelsRef = useRef<Barrel[]>([]);

  const checkBarrelWarnings = useCallback((barrel: Barrel) => {
    if (!barrel.isActive) return;
    
    if (barrel.remainingBeers <= ALMOST_EMPTY_THRESHOLD) {
      notify.warning(
        toastTranslations.warning.almostEmpty.replace('{{barrel}}', `#${barrel.orderNumber}`),
        { id: `barrel:warning:${barrel.id}:almostEmpty` },
      );
    } else if (barrel.remainingBeers <= LOW_BEER_THRESHOLD) {
      notify.warning(
        toastTranslations.warning.lowBeers
          .replace('{{barrel}}', `#${barrel.orderNumber}`)
          .replace('{{count}}', barrel.remainingBeers.toString()),
        { id: `barrel:warning:${barrel.id}:lowBeers` },
      );
    }
  }, []);

  const fetchBarrels = useCallback(async () => {
    try {
      setIsLoading(true);
      // If eventId is provided, fetch event-specific barrels, otherwise fetch all barrels
      const data = eventId 
        ? await barrelService.getByEvent(eventId, includeDeleted)
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
      notify.error(toastTranslations.error.fetch.replace('{{item}}', 'sudy'), {
        id: `barrels:fetch:${eventId ?? 'all'}:${includeDeleted ? 'deleted' : 'active'}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [includeDeleted, eventId, checkBarrelWarnings]);

  const handleDelete = useCallback(async (id: string) => {
    const barrel = barrelsRef.current.find(b => b.id === id);
    try {
      await barrelService.delete(id);
      notify.success(
        toastTranslations.success.deleted.replace('{{item}}', `Sud #${barrel?.orderNumber || id}`),
        { id: `barrel:delete:${id}` },
      );
      await fetchBarrels();
    } catch (error) {
      console.error('Failed to delete barrel:', error);
      notify.error(toastTranslations.error.delete.replace('{{item}}', 'sud'), {
        id: `barrel:delete:${id}`,
      });
    }
  }, [fetchBarrels]);

  const handleToggleActive = useCallback(async (id: string) => {
    const barrel = barrelsRef.current.find(b => b.id === id);
    try {
      await barrelService.activate(id);
      notify.success(
        toastTranslations.success.updated.replace('{{item}}', `Sud #${barrel?.orderNumber || id}`),
        { id: `barrel:activate:${id}` },
      );
      await fetchBarrels();
    } catch (error) {
      console.error('Failed to update barrel status:', error);
      notify.error(toastTranslations.error.update.replace('{{item}}', 'sud'), {
        id: `barrel:activate:${id}`,
      });
    }
  }, [fetchBarrels]);

  const handleCleanup = useCallback(async () => {
    try {
      await barrelService.cleanup();
      notify.success(toastTranslations.success.deleted.replace('{{item}}', 'Smazané sudy'), {
        id: 'barrels:cleanup',
      });
      await fetchBarrels();
    } catch (error) {
      console.error('Failed to cleanup barrels:', error);
      notify.error(toastTranslations.error.delete.replace('{{item}}', 'smazané sudy'), {
        id: 'barrels:cleanup',
      });
    }
  }, [fetchBarrels]);

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