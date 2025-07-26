import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const loadCountRef = useRef(0);

  // Debug logging for state changes
  useEffect(() => {
    console.log('[ActiveEventContext] State Update:', {
      activeEventId: activeEvent?.id,
      userId: user?.id,
      isLoading,
      loadCount: loadCountRef.current
    });
  }, [activeEvent, user, isLoading]);

  const loadActiveEvent = async () => {
    loadCountRef.current += 1;
    const currentLoadCount = loadCountRef.current;
    
    console.log('[ActiveEventContext] Loading Active Event:', {
      loadCount: currentLoadCount,
      userId: user?.id
    });

    try {
      const active = await eventService.getActiveEvent();
      console.log('[ActiveEventContext] Loaded Active Event:', {
        loadCount: currentLoadCount,
        eventId: active?.id,
        previousEventId: activeEvent?.id
      });
      
      // Only update if this is still the most recent load request
      if (currentLoadCount === loadCountRef.current) {
        setActiveEvent(active);
      } else {
        console.log('[ActiveEventContext] Skipping stale update:', {
          loadCount: currentLoadCount,
          currentCount: loadCountRef.current
        });
      }
    } catch (error) {
      console.error('[ActiveEventContext] Failed to load active event:', {
        error,
        loadCount: currentLoadCount
      });
      // Only show error if we're authenticated - otherwise it's expected
      if (user) {
        toast.error('Failed to load active event');
      }
    }
  };

  useEffect(() => {
    console.log('[ActiveEventContext] Auth State Change:', {
      hasUser: !!user,
      isLoading,
      activeEventId: activeEvent?.id
    });

    // Only load active event if we have an authenticated user and auth check is complete
    if (user && !isLoading) {
      loadActiveEvent();
    } else {
      // Clear active event when user is not authenticated
      console.log('[ActiveEventContext] Clearing active event - no authenticated user');
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