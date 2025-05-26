import React, { createContext, useContext, useState, useEffect } from 'react';
import { eventService } from '../services/eventService';
import type { Event } from '../types/event';
import { toast } from 'react-hot-toast';

interface ActiveEventContextType {
  activeEvent: Event | null;
  setActiveEvent: (event: Event | null) => void;
  loadActiveEvent: () => Promise<void>;
}

const ActiveEventContext = createContext<ActiveEventContextType | undefined>(undefined);

export const ActiveEventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);

  const loadActiveEvent = async () => {
    try {
      const active = await eventService.getActiveEvent();
      setActiveEvent(active);
    } catch (error) {
      console.error('Failed to load active event:', error);
      toast.error('Failed to load active event');
    }
  };

  useEffect(() => {
    loadActiveEvent();
  }, []);

  return (
    <ActiveEventContext.Provider value={{ activeEvent, setActiveEvent, loadActiveEvent }}>
      {children}
    </ActiveEventContext.Provider>
  );
};

export const useActiveEvent = () => {
  const context = useContext(ActiveEventContext);
  if (context === undefined) {
    throw new Error('useActiveEvent must be used within an ActiveEventProvider');
  }
  return context;
}; 