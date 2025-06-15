import React, { createContext, useContext, useState, useEffect } from 'react';
import { eventService } from '../services/eventService';
import type { Event } from '../types/event';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';

interface ActiveEventContextType {
  activeEvent: Event | null;
  setActiveEvent: (event: Event | null) => void;
  loadActiveEvent: () => Promise<void>;
}

const ActiveEventContext = createContext<ActiveEventContextType | undefined>(undefined);

export const ActiveEventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const { user, isLoading } = useAuth();

  const loadActiveEvent = async () => {
    try {
      const active = await eventService.getActiveEvent();
      setActiveEvent(active);
    } catch (error) {
      console.error('Failed to load active event:', error);
      // Only show error if we're authenticated - otherwise it's expected
      if (user) {
        toast.error('Failed to load active event');
      }
    }
  };

  useEffect(() => {
    // Only load active event if we have an authenticated user and auth check is complete
    if (user && !isLoading) {
      loadActiveEvent();
    } else {
      // Clear active event when user is not authenticated
      setActiveEvent(null);
    }
  }, [user, isLoading]);

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