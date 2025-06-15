import { useState, useCallback, useEffect, useRef } from 'react';
import { participantsApi } from './api';
import { eventService } from '../../../services/eventService';
import type { Participant } from './types';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { useToast } from '../../../hooks/useToast';
import translations from '../../../locales/cs/dashboard.participants.json';
import toastTranslations from '../../../locales/cs/toasts.json';

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
          const active = eventParticipants.filter(p => !p.deletedAt);
          const deleted = eventParticipants.filter(p => p.deletedAt);
          setParticipants(active);
          setDeletedParticipants(deleted);
          participantsRef.current = active;
          deletedParticipantsRef.current = deleted;
        } else {
          setParticipants(eventParticipants);
          setDeletedParticipants([]);
          participantsRef.current = eventParticipants;
          deletedParticipantsRef.current = [];
        }
      } else {
        // Fallback to all participants if no event is selected
        if (includeDeleted) {
          const data = await participantsApi.getAll(true);
          const active = data.filter(p => !p.deletedAt);
          const deleted = data.filter(p => p.deletedAt);
          setParticipants(active);
          setDeletedParticipants(deleted);
          participantsRef.current = active;
          deletedParticipantsRef.current = deleted;
        } else {
          const data = await participantsApi.getAll(false);
          setParticipants(data);
          setDeletedParticipants([]);
          participantsRef.current = data;
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
    if (!activeEvent) {
      console.error('No active event found!');
      return;
    }
    
    const participant = participantsRef.current.find(p => p.id === id);
    try {
      await eventService.removeUser(activeEvent.id, id);
      toast.success(toastTranslations.success.deleted.replace('{{item}}', 'Účastník'));
      await fetchParticipants();
    } catch (error) {
      console.error('Failed to remove participant from event:', error);
      toast.error(toastTranslations.error.delete.replace('{{item}}', 'účastníka'));
    }
  }, [activeEvent?.id, fetchParticipants]); // Remove toast and participants from dependencies

  const handleAddBeer = useCallback(async (id: string) => {
    const participant = participantsRef.current.find(p => p.id === id);
    try {
      await participantsApi.addBeer(id, activeEvent?.id);
      toast.success(toastTranslations.success.beerAdded.replace('{{user}}', participant?.name || id));
      await fetchParticipants();
    } catch (error) {
      console.error('Failed to add beer:', error);
      toast.error(translations.errors.addBeerFailed);
    }
  }, [activeEvent?.id, fetchParticipants]); // Remove toast and participants from dependencies

  const handleRemoveBeer = useCallback(async (id: string) => {
    const participant = participantsRef.current.find(p => p.id === id);
    try {
      await participantsApi.removeBeer(id, activeEvent?.id);
      toast.success(toastTranslations.success.beerRemoved.replace('{{user}}', participant?.name || id));
      await fetchParticipants();
    } catch (error) {
      console.error('Failed to remove beer:', error);
      toast.error(translations.errors.removeBeerFailed);
    }
  }, [activeEvent?.id, fetchParticipants]); // Remove toast and participants from dependencies

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
    handleAddBeer,
    handleRemoveBeer,
    handleCleanup,
    fetchParticipants,
  };
}; 