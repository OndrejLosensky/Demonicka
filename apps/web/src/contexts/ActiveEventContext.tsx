import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { eventService } from '../services/eventService';
import type { Event } from '@demonicka/shared-types';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { websocketService } from '../services/websocketService';

interface ActiveEventContextType {
  activeEvent: Event | null;
  setActiveEvent: (event: Event | null) => void;
  loadActiveEvent: () => Promise<void>;
  isActiveEventLoading: boolean;
}

const ActiveEventContext = createContext<ActiveEventContextType | undefined>(undefined);

export const ActiveEventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [isActiveEventLoading, setIsActiveEventLoading] = useState<boolean>(true);
  const { user, isLoading } = useAuth();
  const loadCountRef = useRef(0);

  const loadActiveEvent = useCallback(async () => {
    loadCountRef.current += 1;
    const currentLoadCount = loadCountRef.current;

    try {
      setIsActiveEventLoading(true);
      const active = await eventService.getActiveEvent();
      
      // Only update if this is still the most recent load request
      if (currentLoadCount === loadCountRef.current) {
        setActiveEvent(active);
      }
    } catch (error) {
      console.error('[ActiveEventContext] Failed to load active event:', error);
      // Only show error if we're authenticated - otherwise it's expected
      if (user) {
        toast.error('Failed to load active event');
      }
    } finally {
      if (currentLoadCount === loadCountRef.current) {
        setIsActiveEventLoading(false);
      }
    }
  }, [activeEvent?.id, user]);

  useEffect(() => {
    // Always load the active event once auth check completes (even for guests)
    if (!isLoading) {
      void loadActiveEvent();
    }
  }, [user, isLoading, activeEvent?.id, loadActiveEvent]);

  // Join/leave websocket event room when active event changes
  const joinedEventIdRef = useRef<string | null>(null);
  useEffect(() => {
    const newId = activeEvent?.id || null;
    const prevId = joinedEventIdRef.current;
    if (newId && newId !== prevId) {
      if (prevId) {
        websocketService.leaveEvent(prevId);
      }
      websocketService.joinEvent(newId);
      joinedEventIdRef.current = newId;
    }
    return () => {
      if (joinedEventIdRef.current) {
        websocketService.leaveEvent(joinedEventIdRef.current);
        joinedEventIdRef.current = null;
      }
    };
  }, [activeEvent?.id]);

  return (
    <ActiveEventContext.Provider value={{ activeEvent, setActiveEvent, loadActiveEvent, isActiveEventLoading }}>
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