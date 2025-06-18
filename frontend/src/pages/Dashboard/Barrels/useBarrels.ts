import { useState, useCallback, useEffect, useRef } from 'react';
import { barrelService } from '../../../services/barrelService';
import type { Barrel } from '../../../types/barrel';
import { useSelectedEvent } from '../../../contexts/SelectedEventContext';
import { useToast } from '../../../hooks/useToast';
import toastTranslations from '../../../locales/cs/toasts.json';

interface ApiError {
  response?: {
    status?: number;
  };
  message?: string;
}

const LOW_BEER_THRESHOLD = 10;
const ALMOST_EMPTY_THRESHOLD = 5;
const INITIAL_RETRY_DELAY = 2000; // Initial delay of 2 seconds
const MAX_RETRIES = 3;

// Helper function for delay with exponential backoff
const delay = (retryCount: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, INITIAL_RETRY_DELAY * Math.pow(2, retryCount));
  });
};

export const useBarrels = (includeDeleted = false) => {
  const [barrels, setBarrels] = useState<Barrel[]>([]);
  const [deletedBarrels, setDeletedBarrels] = useState<Barrel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedEvent } = useSelectedEvent();
  const toast = useToast();
  
  const barrelsRef = useRef<Barrel[]>([]);
  const deletedBarrelsRef = useRef<Barrel[]>([]);
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);
  const isFirstLoadRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

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

  const handleApiError = useCallback((error: ApiError) => {
    console.error('API Error:', error);
    let errorMessage = toastTranslations.error.fetch.replace('{{item}}', 'sudy');
    
    if (error?.response?.status === 429) {
      errorMessage = 'Příliš mnoho požadavků, prosím počkejte chvíli.';
    } else if (error?.response?.status === 404) {
      errorMessage = 'Data nejsou k dispozici.';
    }
    
    setError(errorMessage);
    toast.error(errorMessage);
  }, [toast]);

  const fetchBarrelsWithRetry = useCallback(async (retryCount = 0): Promise<Barrel[]> => {
    try {
      const data = await barrelService.getAll(false);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError?.response?.status === 429 && retryCount < MAX_RETRIES) {
        await delay(retryCount);
        return fetchBarrelsWithRetry(retryCount + 1);
      }
      throw error;
    }
  }, []);

  const fetchDeletedBarrelsWithRetry = useCallback(async (retryCount = 0): Promise<Barrel[]> => {
    try {
      const data = await barrelService.getDeleted();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError?.response?.status === 429 && retryCount < MAX_RETRIES) {
        await delay(retryCount);
        return fetchDeletedBarrelsWithRetry(retryCount + 1);
      }
      throw error;
    }
  }, []);

  const fetchBarrels = useCallback(async () => {
    // Don't fetch if there's no selected event
    if (!selectedEvent?.id) {
      setBarrels([]);
      setDeletedBarrels([]);
      setIsLoading(false);
      return;
    }

    // Clear any pending fetch
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Add initial delay only for the first load
    const initialDelay = isFirstLoadRef.current ? 1000 : 300;
    isFirstLoadRef.current = false;

    // Debounce the fetch
    fetchTimeoutRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;

      try {
        setIsLoading(true);
        setError(null);
        let fetchedBarrels: Barrel[] = [];
        
        if (includeDeleted) {
          // Fetch both active and deleted barrels
          const [activeBarrels, deletedBarrelsData] = await Promise.all([
            fetchBarrelsWithRetry(),
            fetchDeletedBarrelsWithRetry()
          ]);
          
          fetchedBarrels = activeBarrels;
          const deletedBarrelsArray = deletedBarrelsData;
          
          if (isMountedRef.current) {
            setBarrels(fetchedBarrels);
            setDeletedBarrels(deletedBarrelsArray);
            barrelsRef.current = fetchedBarrels;
            deletedBarrelsRef.current = deletedBarrelsArray;
            
            // Check warnings only for active barrels
            fetchedBarrels.forEach(checkBarrelWarnings);
          }
        } else {
          // Fetch only active barrels
          fetchedBarrels = await fetchBarrelsWithRetry();
          
          if (isMountedRef.current) {
            setBarrels(fetchedBarrels);
            setDeletedBarrels([]);
            barrelsRef.current = fetchedBarrels;
            deletedBarrelsRef.current = [];
            
            fetchedBarrels.forEach(checkBarrelWarnings);
          }
        }
      } catch (error) {
        handleApiError(error as ApiError);
        if (isMountedRef.current) {
          // Set empty arrays in case of error
          setBarrels([]);
          setDeletedBarrels([]);
          barrelsRef.current = [];
          deletedBarrelsRef.current = [];
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }, initialDelay);
  }, [
    includeDeleted,
    selectedEvent?.id,
    checkBarrelWarnings,
    fetchBarrelsWithRetry,
    fetchDeletedBarrelsWithRetry,
    handleApiError
  ]);

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

  // Only fetch when selectedEvent changes
  useEffect(() => {
    fetchBarrels();
  }, [fetchBarrels, selectedEvent?.id]);

  return {
    barrels,
    deletedBarrels,
    isLoading,
    error,
    handleDelete,
    handleToggleActive,
    handleCleanup,
    fetchBarrels,
  };
}; 