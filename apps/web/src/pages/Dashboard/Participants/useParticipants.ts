import { useState, useCallback, useEffect, useRef } from 'react';
import { participantsApi } from './api';
import type { Participant } from './types';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { useToast } from '../../../hooks/useToast';
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
  const toast = useToast();
  
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
      toast.error(toastTranslations.error.fetch.replace('{{item}}', 'účastníky'));
    } finally {
      setIsLoading(false);
    }
  }, [includeDeleted, activeEvent?.id]); // Remove toast from dependencies

  const handleDelete = useCallback(async (id: string) => {
    try {
      await participantsApi.delete(id);
      toast.success(toastTranslations.success.deleted.replace('{{item}}', 'Účastníka'));
      await fetchParticipants();
    } catch (error) {
      console.error('Failed to delete participant:', error);
      toast.error(toastTranslations.error.delete.replace('{{item}}', 'účastníka'));
    }
  }, [fetchParticipants, toast]); // Remove participants from dependencies

  const handleRestore = useCallback(async (id: string) => {
    try {
      await participantsApi.restore(id);
      toast.success(toastTranslations.success.restored.replace('{{item}}', 'Účastník'));
      await fetchParticipants();
    } catch (error) {
      console.error('Failed to restore participant:', error);
      toast.error(toastTranslations.error.restore.replace('{{item}}', 'účastníka'));
    }
  }, [fetchParticipants, toast]);

  const handleAddBeer = useCallback(async (id: string) => {
    const participant = participantsRef.current.find(p => p.id === id);
    if (!participant) return;

    // Optimistic update: immediately update local state
    setParticipants(prevParticipants => {
      const updated = prevParticipants.map(p => 
        p.id === id 
          ? { ...p, eventBeerCount: (p.eventBeerCount ?? 0) + 1 }
          : p
      );
      participantsRef.current = updated;
      return updated;
    });

    try {
      await participantsApi.addBeer(id, activeEvent?.id);
      toast.success(toastTranslations.success.beerAdded.replace('{{user}}', participant?.name || participant?.username || id));
      // Refresh in background to sync with server (e.g., lastBeerTime)
      fetchParticipants().catch(error => {
        console.error('Failed to sync participants after adding beer:', error);
      });
    } catch (error) {
      console.error('Failed to add beer:', error);
      // Revert optimistic update on error
      setParticipants(prevParticipants => {
        const reverted = prevParticipants.map(p => 
          p.id === id 
            ? { ...p, eventBeerCount: Math.max((p.eventBeerCount ?? 1) - 1, 0) }
            : p
        );
        participantsRef.current = reverted;
        return reverted;
      });
      toast.error(translations.errors.addBeerFailed);
    }
  }, [activeEvent?.id, fetchParticipants, toast]); // Remove toast and participants from dependencies

  const handleRemoveBeer = useCallback(async (id: string) => {
    const participant = participantsRef.current.find(p => p.id === id);
    if (!participant) return;

    const currentCount = participant.eventBeerCount ?? 0;
    if (currentCount === 0) return;

    // Optimistic update: immediately update local state
    setParticipants(prevParticipants => {
      const updated = prevParticipants.map(p => 
        p.id === id 
          ? { ...p, eventBeerCount: Math.max((p.eventBeerCount ?? 0) - 1, 0) }
          : p
      );
      participantsRef.current = updated;
      return updated;
    });

    try {
      await participantsApi.removeBeer(id, activeEvent?.id);
      toast.success(toastTranslations.success.beerRemoved.replace('{{user}}', participant?.name || participant?.username || id));
      // Refresh in background to sync with server
      fetchParticipants().catch(error => {
        console.error('Failed to sync participants after removing beer:', error);
      });
    } catch (error) {
      console.error('Failed to remove beer:', error);
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
      toast.error(translations.errors.removeBeerFailed);
    }
  }, [activeEvent?.id, fetchParticipants, toast]); // Remove toast and participants from dependencies

  const handleCleanup = useCallback(async () => {
    try {
      await participantsApi.cleanup();
      toast.success(toastTranslations.success.deleted.replace('{{item}}', 'Smazaní účastníci'));
      await fetchParticipants();
    } catch (error) {
      console.error('Failed to cleanup participants:', error);
      toast.error(toastTranslations.error.delete.replace('{{item}}', 'smazané účastníky'));
    }
  }, [fetchParticipants]); // Remove toast from dependencies

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
    handleRemoveBeer,
    handleCleanup,
    fetchParticipants,
  };
}; 