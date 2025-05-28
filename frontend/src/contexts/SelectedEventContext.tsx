import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Event } from '../types/event';
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

  // Custom setSelectedEvent that tracks manual selections
  const handleSetSelectedEvent = (event: Event | null) => {
    manualSelectionRef.current = true;
    setSelectedEvent(event);
  };

  // When active event changes, reset selected event to active event (but only if not manually selected)
  useEffect(() => {
    if (activeEvent) {
      // Only auto-update if:
      // 1. There's no selected event yet, OR
      // 2. The active event ID changed (new event created), OR
      // 3. We're viewing the active event and it wasn't manually selected (to get updated data)
      if (!selectedEvent || 
          selectedEvent.id !== activeEvent.id || 
          (selectedEvent.id === activeEvent.id && selectedEvent.isActive && !manualSelectionRef.current)) {
        manualSelectionRef.current = false; // Reset manual selection flag
        setSelectedEvent(activeEvent);
      }
    } else if (!activeEvent && selectedEvent?.isActive) {
      // If there's no active event but we're viewing an active event, clear it
      manualSelectionRef.current = false;
      setSelectedEvent(null);
    }
  }, [activeEvent, selectedEvent]);

  // Reset manual selection flag when active event changes (new event created)
  useEffect(() => {
    manualSelectionRef.current = false;
  }, [activeEvent?.id]);

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