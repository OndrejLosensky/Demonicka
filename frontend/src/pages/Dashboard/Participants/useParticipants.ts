import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { participantsApi } from './api';
import { eventService } from '../../../services/eventService';
import type { Participant } from './types';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import translations from '../../../locales/cs/dashboard.participants.json';

export const useParticipants = (includeDeleted = false) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [deletedParticipants, setDeletedParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { activeEvent } = useActiveEvent();

  const fetchParticipants = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (activeEvent) {
        // Get participants for the active event
        const eventParticipants = await participantsApi.getByEvent(activeEvent.id, includeDeleted);
        if (includeDeleted) {
          const active = eventParticipants.filter(p => !p.deletedAt);
          const deleted = eventParticipants.filter(p => p.deletedAt);
          setParticipants(active);
          setDeletedParticipants(deleted);
        } else {
          setParticipants(eventParticipants);
          setDeletedParticipants([]);
        }
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
  }, [includeDeleted, activeEvent?.id]);

  const handleDelete = useCallback(async (id: string) => {
    console.log('handleDelete called with ID:', id);
    if (!activeEvent) {
      console.error('No active event found!');
      return;
    }
    console.log('Active event:', activeEvent);
    
    try {
      console.log('Calling eventService.removeUser with eventId:', activeEvent.id, 'and userId:', id);
      await eventService.removeUser(activeEvent.id, id);
      toast.success(translations.dialogs.delete.success);
      await fetchParticipants();
    } catch (error: unknown) {
      console.error('Failed to remove participant from event:', error);
      toast.error(translations.dialogs.delete.error);
    }
  }, [activeEvent, fetchParticipants]);

  const handleAddBeer = useCallback(async (id: string) => {
    try {
      await participantsApi.addBeer(id, activeEvent?.id);
      toast.success(translations.errors.beerAdded);
      await fetchParticipants();
    } catch (error: unknown) {
      console.error('Failed to add beer:', error);
      toast.error(translations.errors.addBeerFailed);
    }
  }, [fetchParticipants, activeEvent?.id]);

  const handleRemoveBeer = useCallback(async (id: string) => {
    try {
      await participantsApi.removeBeer(id, activeEvent?.id);
      toast.success(translations.errors.beerRemoved);
      await fetchParticipants();
    } catch (error: unknown) {
      console.error('Failed to remove beer:', error);
      toast.error(translations.errors.removeBeerFailed);
    }
  }, [fetchParticipants, activeEvent?.id]);

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