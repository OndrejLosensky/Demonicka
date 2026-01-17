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

  // Custom setSelectedEvent that tracks manual selections
  const handleSetSelectedEvent = (event: Event | null) => {
    manualSelectionRef.current = true;
    setSelectedEvent(event);
  };

  // Combined effect to handle both active event changes and manual selections
  useEffect(() => {
    updateCountRef.current += 1;

    // Skip if we have a manual selection and the IDs match
    if (manualSelectionRef.current && selectedEvent?.id === activeEvent?.id) {
      return;
    }

    // Handle active event changes
    if (activeEvent) {
      const shouldUpdate = !selectedEvent || 
          selectedEvent.id !== activeEvent.id || 
          (selectedEvent.id === activeEvent.id && activeEvent.isActive);

      if (shouldUpdate) {
        manualSelectionRef.current = false;
        setSelectedEvent(activeEvent);
      }
    } else if (!activeEvent && selectedEvent?.isActive) {
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