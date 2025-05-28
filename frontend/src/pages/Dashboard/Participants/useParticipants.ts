import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { participantsApi } from './api';
import type { Participant } from './types';
import { useSelectedEvent } from '../../../contexts/SelectedEventContext';
import translations from '../../../locales/cs/dashboard.participants.json';

export const useParticipants = (includeDeleted = false) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [deletedParticipants, setDeletedParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedEvent } = useSelectedEvent();

  const fetchParticipants = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (selectedEvent) {
        // Get participants for the selected event
        const eventParticipants = await participantsApi.getByEvent(selectedEvent.id);
        setParticipants(eventParticipants);
        setDeletedParticipants([]);
      } else {
        // Fallback to all participants if no event is selected
        if (includeDeleted) {
          const data = await participantsApi.getAll(true);
          const active = data.filter(p => !p.deletedAt);
          const deleted = data.filter(p => p.deletedAt);
          setParticipants(active);
          setDeletedParticipants(deleted);
        } else {
          const data = await participantsApi.getAll(false);
          setParticipants(data);
          setDeletedParticipants([]);
        }
      }
    } catch (error: unknown) {
      console.error('Failed to fetch participants:', error);
      toast.error(translations.errors.fetchFailed);
    } finally {
      setIsLoading(false);
    }
  }, [includeDeleted, selectedEvent?.id, selectedEvent?.updatedAt, selectedEvent?.participants?.length]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await participantsApi.delete(id);
      toast.success(translations.dialogs.delete.success);
      await fetchParticipants();
    } catch (error: unknown) {
      console.error('Failed to delete participant:', error);
      toast.error(translations.dialogs.delete.error);
    }
  }, [fetchParticipants]);

  const handleAddBeer = useCallback(async (id: string) => {
    try {
      await participantsApi.addBeer(id);
      toast.success(translations.errors.beerAdded);
      await fetchParticipants();
    } catch (error: unknown) {
      console.error('Failed to add beer:', error);
      toast.error(translations.errors.addBeerFailed);
    }
  }, [fetchParticipants]);

  const handleRemoveBeer = useCallback(async (id: string) => {
    try {
      await participantsApi.removeBeer(id);
      toast.success(translations.errors.beerRemoved);
      await fetchParticipants();
    } catch (error: unknown) {
      console.error('Failed to remove beer:', error);
      toast.error(translations.errors.removeBeerFailed);
    }
  }, [fetchParticipants]);

  const handleCleanup = useCallback(async () => {
    try {
      await participantsApi.cleanup();
      toast.success(translations.dialogs.cleanupAll.success);
      await fetchParticipants();
    } catch (error: unknown) {
      console.error('Failed to cleanup participants:', error);
      toast.error(translations.dialogs.cleanupAll.error);
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
    handleAddBeer,
    handleRemoveBeer,
    handleCleanup,
    fetchParticipants,
  };
}; 