import { useState, useCallback, useEffect, useRef } from 'react';
import { participantsApi } from './api';
import type { Participant } from './types';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { notify } from '../../../notifications/notify';
import translations from '../../../locales/cs/dashboard.participants.json';
import toastTranslations from '../../../locales/cs/toasts.json';

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
    } catch (error) {
      console.error('Failed to fetch participants:', error);
      notify.error(toastTranslations.error.fetch.replace('{{item}}', 'účastníky'), {
        id: `participants:fetch:${activeEvent?.id ?? 'all'}:${includeDeleted ? 'deleted' : 'active'}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [includeDeleted, activeEvent?.id]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await participantsApi.delete(id);
      notify.success(toastTranslations.success.deleted.replace('{{item}}', 'Účastníka'), {
        id: `participant:delete:${id}`,
      });
      await fetchParticipants();
    } catch (error) {
      console.error('Failed to delete participant:', error);
      notify.error(toastTranslations.error.delete.replace('{{item}}', 'účastníka'), {
        id: `participant:delete:${id}`,
      });
    }
  }, [fetchParticipants]);

  const handleRestore = useCallback(async (id: string) => {
    try {
      await participantsApi.restore(id);
      notify.success(toastTranslations.success.restored.replace('{{item}}', 'Účastník'), {
        id: `participant:restore:${id}`,
      });
      await fetchParticipants();
    } catch (error) {
      console.error('Failed to restore participant:', error);
      notify.error(toastTranslations.error.restore.replace('{{item}}', 'účastníka'), {
        id: `participant:restore:${id}`,
      });
    }
  }, [fetchParticipants]);

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
        toastTranslations.success.beerAdded.replace(
          '{{user}}',
          participant?.username || id,
        ),
        { id: toastId },
      );
      // Refresh in background to sync with server (e.g., lastBeerTime)
      fetchParticipants().catch(error => {
        console.error('Failed to sync participants after adding beer:', error);
      });
    } catch (error) {
      console.error('Failed to add beer:', error);
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
      notify.error(translations.errors.addBeerFailed, { id: toastId });
    }
  }, [activeEvent?.id, fetchParticipants]);

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
        toastTranslations.success.beerAdded.replace(
          '{{user}}',
          participant?.username || id,
        ),
        { id: toastId },
      );
      fetchParticipants().catch(error => {
        console.error('Failed to sync participants after adding spilled beer:', error);
      });
    } catch (error) {
      console.error('Failed to add spilled beer:', error);
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
      notify.error(translations.errors.addSpilledBeerFailed ?? translations.errors.addBeerFailed, { id: toastId });
    }
  }, [activeEvent?.id, fetchParticipants]);

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
        toastTranslations.success.beerRemoved.replace(
          '{{user}}',
          participant?.username || id,
        ),
        { id: toastId },
      );
      // Refresh in background to sync with server
      fetchParticipants().catch(error => {
        console.error('Failed to sync participants after removing beer:', error);
      });
    } catch (error) {
      console.error('Failed to remove beer:', error);
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
      notify.error(translations.errors.removeBeerFailed, { id: toastId });
    }
  }, [activeEvent?.id, fetchParticipants]);

  const handleCleanup = useCallback(async () => {
    try {
      await participantsApi.cleanup();
      notify.success(toastTranslations.success.deleted.replace('{{item}}', 'Smazaní účastníci'), {
        id: 'participants:cleanup',
      });
      await fetchParticipants();
    } catch (error) {
      console.error('Failed to cleanup participants:', error);
      notify.error(toastTranslations.error.delete.replace('{{item}}', 'smazané účastníky'), {
        id: 'participants:cleanup',
      });
    }
  }, [fetchParticipants]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

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