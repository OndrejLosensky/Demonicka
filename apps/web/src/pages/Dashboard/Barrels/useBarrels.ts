import { useState, useCallback, useEffect, useRef } from 'react';
import { barrelService } from '../../../services/barrelService';
import { websocketService } from '../../../services/websocketService';
import type { Barrel } from '@demonicka/shared-types';
import { notify } from '../../../notifications/notify';
import { useTranslations } from '../../../contexts/LocaleContext';

const LOW_BEER_THRESHOLD = 10;
const ALMOST_EMPTY_THRESHOLD = 5;
const LOW_LITRES_THRESHOLD = 5.0; // 10 beers * 0.5L
const ALMOST_EMPTY_LITRES_THRESHOLD = 2.5; // 5 beers * 0.5L

export const useBarrels = (includeDeleted = false, eventId?: string) => {
  const [barrels, setBarrels] = useState<Barrel[]>([]);
  const [deletedBarrels, setDeletedBarrels] = useState<Barrel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toastT = useTranslations<Record<string, Record<string, string>>>('toasts');
  const success = toastT.success as Record<string, string> | undefined;
  const toastError = toastT.error as Record<string, string> | undefined;
  const warning = toastT.warning as Record<string, string> | undefined;
  
  // Use refs to maintain stable references to mutable data
  const barrelsRef = useRef<Barrel[]>([]);
  const deletedBarrelsRef = useRef<Barrel[]>([]);

  const checkBarrelWarnings = useCallback((barrel: Barrel) => {
    if (!barrel.isActive) return;
    
    const remainingLitres = Number(barrel.remainingLitres || 0);
    
    if (remainingLitres <= ALMOST_EMPTY_LITRES_THRESHOLD) {
      notify.warning(
        (warning?.almostEmpty ?? 'Sud {{barrel}} je téměř prázdný').replace('{{barrel}}', `#${barrel.orderNumber}`),
        { id: `barrel:warning:${barrel.id}:almostEmpty` },
      );
    } else if (remainingLitres <= LOW_LITRES_THRESHOLD) {
      notify.warning(
        (warning?.lowBeers ?? 'V sudu {{barrel}} zbývá pouze {{count}} piv')
          .replace('{{barrel}}', `#${barrel.orderNumber}`)
          .replace('{{count}}', remainingLitres.toFixed(1) + ' L'),
        { id: `barrel:warning:${barrel.id}:lowBeers` },
      );
    }
  }, [warning]);

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
    } catch (err) {
      console.error('Failed to fetch barrels:', err);
      notify.error((toastError?.fetch ?? 'Nepodařilo se načíst {{item}}').replace('{{item}}', 'sudy'), {
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
        (success?.deleted ?? '{{item}} byl úspěšně smazán').replace('{{item}}', `Sud #${barrel?.orderNumber || id}`),
        { id: `barrel:delete:${id}` },
      );
      await fetchBarrels();
    } catch (err) {
      console.error('Failed to delete barrel:', err);
      notify.error((toastError?.delete ?? 'Nepodařilo se smazat {{item}}').replace('{{item}}', 'sud'), {
        id: `barrel:delete:${id}`,
      });
    }
  }, [fetchBarrels, success, toastError]);

  const handleToggleActive = useCallback(async (id: string) => {
    const barrel = barrelsRef.current.find(b => b.id === id);
    try {
      await barrelService.activate(id);
      notify.success(
        (success?.updated ?? '{{item}} byl úspěšně aktualizován').replace('{{item}}', `Sud #${barrel?.orderNumber || id}`),
        { id: `barrel:activate:${id}` },
      );
      await fetchBarrels();
    } catch (err) {
      console.error('Failed to update barrel status:', err);
      notify.error((toastError?.update ?? 'Nepodařilo se aktualizovat {{item}}').replace('{{item}}', 'sud'), {
        id: `barrel:activate:${id}`,
      });
    }
  }, [fetchBarrels, success, toastError]);

  const handleCleanup = useCallback(async () => {
    try {
      await barrelService.cleanup();
      notify.success((success?.deleted ?? '{{item}} byl úspěšně smazán').replace('{{item}}', 'Smazané sudy'), {
        id: 'barrels:cleanup',
      });
      await fetchBarrels();
    } catch (err) {
      console.error('Failed to cleanup barrels:', err);
      notify.error((toastError?.delete ?? 'Nepodařilo se smazat {{item}}').replace('{{item}}', 'smazané sudy'), {
        id: 'barrels:cleanup',
      });
    }
  }, [fetchBarrels, success, toastError]);

  // Fetch when includeDeleted or eventId changes
  useEffect(() => {
    fetchBarrels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeDeleted, eventId]); // fetchBarrels is stable via useCallback with these deps

  // Refetch barrels when beers are added (barrel remainingLitres change) so values update without manual refresh
  useEffect(() => {
    const handleStatsUpdate = () => {
      fetchBarrels();
    };
    websocketService.subscribe('dashboard:stats:update', handleStatsUpdate);
    return () => websocketService.unsubscribe('dashboard:stats:update', handleStatsUpdate);
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