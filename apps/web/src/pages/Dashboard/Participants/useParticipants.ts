import { useState, useCallback, useEffect, useRef } from 'react';
import { participantsApi } from './api';
import type { Participant } from './types';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { websocketService } from '../../../services/websocketService';
import { notify } from '../../../notifications/notify';
import { useTranslations } from '../../../contexts/LocaleContext';

// Helper function to sort participants by username (name) alphabetically
const sortParticipantsByName = (participants: Participant[]): Participant[] => {
  return [...participants].sort((a, b) => {
    const nameA = (a.name || a.username || '').toLowerCase();
    const nameB = (b.name || b.username || '').toLowerCase();
    return nameA.localeCompare(nameB, 'cs', { sensitivity: 'base' });
  });
};

export const useParticipants = (includeDeleted = false) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [deletedParticipants, setDeletedParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { activeEvent } = useActiveEvent();
  const toastT = useTranslations<Record<string, Record<string, string>>>('toasts');
  const partT = useTranslations<Record<string, Record<string, string>>>('dashboard.participants');
  const success = toastT.success as Record<string, string> | undefined;
  const toastError = toastT.error as Record<string, string> | undefined;
  const errors = partT.errors as Record<string, string> | undefined;
  
  // Use refs to maintain stable references to mutable data
  const participantsRef = useRef<Participant[]>([]);
  const deletedParticipantsRef = useRef<Participant[]>([]);

  const fetchParticipants = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (activeEvent) {
        // Get participants for the active event
        const eventParticipants = await participantsApi.getByEvent(activeEvent.id, includeDeleted);
        if (includeDeleted) {
          const active = sortParticipantsByName(eventParticipants.filter(p => !p.deletedAt));
          const deleted = sortParticipantsByName(eventParticipants.filter(p => p.deletedAt));
          setParticipants(active);
          setDeletedParticipants(deleted);
          participantsRef.current = active;
          deletedParticipantsRef.current = deleted;
        } else {
          const sorted = sortParticipantsByName(eventParticipants);
          setParticipants(sorted);
          setDeletedParticipants([]);
          participantsRef.current = sorted;
          deletedParticipantsRef.current = [];
        }
      } else {
        // Fallback to all participants if no event is selected
        if (includeDeleted) {
          const data = await participantsApi.getAll(true);
          const active = sortParticipantsByName(data.filter(p => !p.deletedAt));
          const deleted = sortParticipantsByName(data.filter(p => p.deletedAt));
          setParticipants(active);
          setDeletedParticipants(deleted);
          participantsRef.current = active;
          deletedParticipantsRef.current = deleted;
        } else {
          const data = await participantsApi.getAll(false);
          const sorted = sortParticipantsByName(data);
          setParticipants(sorted);
          setDeletedParticipants([]);
          participantsRef.current = sorted;
          deletedParticipantsRef.current = [];
        }
      }
    } catch (err) {
      console.error('Failed to fetch participants:', err);
      notify.error((toastError?.fetch ?? 'Nepodařilo se načíst {{item}}').replace('{{item}}', 'účastníky'), {
        id: `participants:fetch:${activeEvent?.id ?? 'all'}:${includeDeleted ? 'deleted' : 'active'}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [includeDeleted, activeEvent?.id]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await participantsApi.delete(id);
      notify.success((success?.deleted ?? '{{item}} byl úspěšně smazán').replace('{{item}}', 'Účastníka'), {
        id: `participant:delete:${id}`,
      });
      await fetchParticipants();
    } catch (err) {
      console.error('Failed to delete participant:', err);
      notify.error((toastError?.delete ?? 'Nepodařilo se smazat {{item}}').replace('{{item}}', 'účastníka'), {
        id: `participant:delete:${id}`,
      });
    }
  }, [fetchParticipants, success, toastError]);

  const handleRestore = useCallback(async (id: string) => {
    try {
      await participantsApi.restore(id);
      notify.success((success?.restored ?? '{{item}} byl úspěšně obnoven').replace('{{item}}', 'Účastník'), {
        id: `participant:restore:${id}`,
      });
      await fetchParticipants();
    } catch (err) {
      console.error('Failed to restore participant:', err);
      notify.error((toastError?.restore ?? 'Nepodařilo se obnovit {{item}}').replace('{{item}}', 'účastníka'), {
        id: `participant:restore:${id}`,
      });
    }
  }, [fetchParticipants, success, toastError]);

  const handleAddBeer = useCallback(async (id: string, beerSize: 'SMALL' | 'LARGE' = 'LARGE', volumeLitres: number = 0.5) => {
    const participant = participantsRef.current.find(p => p.id === id);
    if (!participant) return;

    // Optimistic update: immediately update local state
    setParticipants(prevParticipants => {
      const updated = prevParticipants.map(p => 
        p.id === id 
          ? { 
              ...p, 
              eventBeerCount: (p.eventBeerCount ?? 0) + 1,
              eventNonSpilledBeerCount: (p.eventNonSpilledBeerCount ?? 0) + 1,
            }
          : p
      );
      participantsRef.current = updated;
      return updated;
    });

    try {
      await participantsApi.addBeer(id, activeEvent?.id, { beerSize, volumeLitres });
      const toastId = `beer:add:${activeEvent?.id ?? 'none'}:${id}`;
      notify.success(
        (success?.beerAdded ?? 'Pivo bylo přidáno uživateli {{user}}').replace(
          '{{user}}',
          participant?.username || id,
        ),
        { id: toastId },
      );
      // Optimistic update already applied; skip full refetch to avoid 2s reload.
      // Leaderboard/dashboard WebSocket will sync if needed.
    } catch (err) {
      console.error('Failed to add beer:', err);
      const toastId = `beer:add:${activeEvent?.id ?? 'none'}:${id}`;
      // Revert optimistic update on error
      setParticipants(prevParticipants => {
        const reverted = prevParticipants.map(p =>
          p.id === id
            ? {
                ...p,
                eventBeerCount: Math.max((p.eventBeerCount ?? 1) - 1, 0),
                eventNonSpilledBeerCount: Math.max((p.eventNonSpilledBeerCount ?? 1) - 1, 0),
              }
            : p
        );
        participantsRef.current = reverted;
        return reverted;
      });
      notify.error(errors?.addBeerFailed ?? 'Nepodařilo se přidat pivo', { id: toastId });
    }
  }, [activeEvent?.id, fetchParticipants, success, errors]);

  const handleAddSpilledBeer = useCallback(async (id: string) => {
    if (!activeEvent?.id) return;
    const participant = participantsRef.current.find(p => p.id === id);
    if (!participant) return;

    // Optimistic update: total +1, spilled +1
    setParticipants(prevParticipants => {
      const updated = prevParticipants.map(p => 
        p.id === id 
          ? { 
              ...p, 
              eventBeerCount: (p.eventBeerCount ?? 0) + 1,
              eventSpilledBeerCount: (p.eventSpilledBeerCount ?? 0) + 1,
            }
          : p
      );
      participantsRef.current = updated;
      return updated;
    });

    try {
      await participantsApi.addSpilledBeer(id, activeEvent.id);
      const toastId = `beer:spilled:add:${activeEvent.id}:${id}`;
      notify.success(
        (success?.beerAdded ?? 'Pivo bylo přidáno uživateli {{user}}').replace(
          '{{user}}',
          participant?.username || id,
        ),
        { id: toastId },
      );
      // Optimistic update already applied; skip full refetch.
    } catch (err) {
      console.error('Failed to add spilled beer:', err);
      const toastId = `beer:spilled:add:${activeEvent.id}:${id}`;
      // Revert optimistic update on error
      setParticipants(prevParticipants => {
        const reverted = prevParticipants.map(p =>
          p.id === id
            ? {
                ...p,
                eventBeerCount: Math.max((p.eventBeerCount ?? 1) - 1, 0),
                eventSpilledBeerCount: Math.max((p.eventSpilledBeerCount ?? 1) - 1, 0),
              }
            : p
        );
        participantsRef.current = reverted;
        return reverted;
      });
      notify.error(errors?.addSpilledBeerFailed ?? errors?.addBeerFailed ?? 'Nepodařilo se přidat rozlité pivo', { id: toastId });
    }
  }, [activeEvent?.id, fetchParticipants, success, errors]);

  const handleRemoveBeer = useCallback(async (id: string) => {
    const participant = participantsRef.current.find(p => p.id === id);
    if (!participant) return;

    const currentCount = participant.eventBeerCount ?? 0;
    if (currentCount === 0) return;

    // Optimistic update: immediately update local state
    setParticipants(prevParticipants => {
      const updated = prevParticipants.map(p => 
        p.id === id 
          ? { 
              ...p, 
              eventBeerCount: Math.max((p.eventBeerCount ?? 0) - 1, 0),
              // Best-effort decrement until server sync (we can't know whether the last beer was spilled)
              eventNonSpilledBeerCount:
                (p.eventNonSpilledBeerCount ?? 0) > 0
                  ? Math.max((p.eventNonSpilledBeerCount ?? 0) - 1, 0)
                  : (p.eventNonSpilledBeerCount ?? 0),
              eventSpilledBeerCount:
                (p.eventNonSpilledBeerCount ?? 0) > 0
                  ? (p.eventSpilledBeerCount ?? 0)
                  : Math.max((p.eventSpilledBeerCount ?? 0) - 1, 0),
            }
          : p
      );
      participantsRef.current = updated;
      return updated;
    });

    try {
      await participantsApi.removeBeer(id, activeEvent?.id);
      const toastId = `beer:remove:${activeEvent?.id ?? 'none'}:${id}`;
      notify.success(
        (success?.beerRemoved ?? 'Pivo bylo odebráno uživateli {{user}}').replace(
          '{{user}}',
          participant?.username || id,
        ),
        { id: toastId },
      );
      // Optimistic update already applied; skip full refetch.
    } catch (err) {
      console.error('Failed to remove beer:', err);
      const toastId = `beer:remove:${activeEvent?.id ?? 'none'}:${id}`;
      // Revert optimistic update on error
      setParticipants(prevParticipants => {
        const reverted = prevParticipants.map(p => 
          p.id === id 
            ? { ...p, eventBeerCount: currentCount }
            : p
        );
        participantsRef.current = reverted;
        return reverted;
      });
      notify.error(errors?.removeBeerFailed ?? 'Nepodařilo se odebrat pivo', { id: toastId });
    }
  }, [activeEvent?.id, fetchParticipants, success, errors]);

  const handleCleanup = useCallback(async () => {
    try {
      await participantsApi.cleanup();
      notify.success((success?.deleted ?? '{{item}} byl úspěšně smazán').replace('{{item}}', 'Smazaní účastníci'), {
        id: 'participants:cleanup',
      });
      await fetchParticipants();
    } catch (err) {
      console.error('Failed to cleanup participants:', err);
      notify.error((toastError?.delete ?? 'Nepodařilo se smazat {{item}}').replace('{{item}}', 'smazané účastníky'), {
        id: 'participants:cleanup',
      });
    }
  }, [fetchParticipants, success, toastError]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Refetch participants when beers change elsewhere (e.g. mobile app)
  useEffect(() => {
    if (!activeEvent?.id) return;

    const refreshOnBeerUpdate = () => {
      void fetchParticipants();
    };

    websocketService.subscribe('dashboard:stats:update', refreshOnBeerUpdate);
    websocketService.subscribe('leaderboard:update', refreshOnBeerUpdate);

    return () => {
      websocketService.unsubscribe('dashboard:stats:update', refreshOnBeerUpdate);
      websocketService.unsubscribe('leaderboard:update', refreshOnBeerUpdate);
    };
  }, [activeEvent?.id, fetchParticipants]);

  return {
    participants,
    deletedParticipants,
    isLoading,
    handleDelete,
    handleRestore,
    handleAddBeer,
    handleAddSpilledBeer,
    handleRemoveBeer,
    handleCleanup,
    fetchParticipants,
  };
}; 