import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Event } from '@demonicka/shared-types';
import { useActiveEvent } from './ActiveEventContext';

interface SelectedEventContextType {
  selectedEvent: Event | null;
  setSelectedEvent: (event: Event | null) => void;
  isViewingHistory: boolean;
}

const SelectedEventContext = createContext<SelectedEventContextType | undefined>(undefined);

interface SelectedEventProviderProps {
  children: ReactNode;
}

export const SelectedEventProvider: React.FC<SelectedEventProviderProps> = ({ children }) => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { activeEvent } = useActiveEvent();
  const manualSelectionRef = useRef(false);
  const updateCountRef = useRef(0);

  // Debug logging for state changes
  useEffect(() => {
    console.log('[SelectedEventContext] State Update:', {
      selectedEventId: selectedEvent?.id,
      activeEventId: activeEvent?.id,
      manualSelection: manualSelectionRef.current,
      updateCount: updateCountRef.current
    });
  }, [selectedEvent, activeEvent]);

  // Custom setSelectedEvent that tracks manual selections
  const handleSetSelectedEvent = (event: Event | null) => {
    console.log('[SelectedEventContext] Manual Selection:', {
      newEventId: event?.id,
      currentEventId: selectedEvent?.id
    });
    manualSelectionRef.current = true;
    setSelectedEvent(event);
  };

  // Combined effect to handle both active event changes and manual selections
  useEffect(() => {
    updateCountRef.current += 1;
    console.log('[SelectedEventContext] Effect Triggered:', {
      updateCount: updateCountRef.current,
      manualSelection: manualSelectionRef.current,
      selectedEventId: selectedEvent?.id,
      activeEventId: activeEvent?.id
    });

    // Skip if we have a manual selection and the IDs match
    if (manualSelectionRef.current && selectedEvent?.id === activeEvent?.id) {
      console.log('[SelectedEventContext] Skipping update - manual selection with matching IDs');
      return;
    }

    // Handle active event changes
    if (activeEvent) {
      const shouldUpdate = !selectedEvent || 
          selectedEvent.id !== activeEvent.id || 
          (selectedEvent.id === activeEvent.id && activeEvent.isActive);

      console.log('[SelectedEventContext] Update Check:', {
        shouldUpdate,
        reason: !selectedEvent ? 'no selected event' :
               selectedEvent.id !== activeEvent.id ? 'different event ids' :
               'active event update'
      });

      if (shouldUpdate) {
        manualSelectionRef.current = false;
        setSelectedEvent(activeEvent);
      }
    } else if (!activeEvent && selectedEvent?.isActive) {
      console.log('[SelectedEventContext] Clearing selection - no active event');
      manualSelectionRef.current = false;
      setSelectedEvent(null);
    }
  }, [activeEvent, selectedEvent]);

  const isViewingHistory = selectedEvent ? !selectedEvent.isActive : false;

  return (
    <SelectedEventContext.Provider value={{
      selectedEvent,
      setSelectedEvent: handleSetSelectedEvent,
      isViewingHistory,
    }}>
      {children}
    </SelectedEventContext.Provider>
  );
};

export const useSelectedEvent = (): SelectedEventContextType => {
  const context = useContext(SelectedEventContext);
  if (context === undefined) {
    throw new Error('useSelectedEvent must be used within a SelectedEventProvider');
  }
  return context;
}; 