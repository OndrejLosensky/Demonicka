import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';

type DashboardChromeState = {
  left?: React.ReactNode;
  action?: React.ReactNode;
};

type DashboardChromeDispatch = {
  setLeft: (node?: React.ReactNode) => void;
  setAction: (node?: React.ReactNode) => void;
  clear: () => void;
};

const DashboardChromeStateContext = createContext<DashboardChromeState | null>(null);
const DashboardChromeDispatchContext = createContext<DashboardChromeDispatch | null>(null);

export function DashboardChromeProvider({ children }: { children: React.ReactNode }) {
  const [left, setLeftState] = useState<React.ReactNode | undefined>(undefined);
  const [action, setActionState] = useState<React.ReactNode | undefined>(undefined);

  const dispatch = useMemo<DashboardChromeDispatch>(
    () => ({
      setLeft: (node) => setLeftState(node),
      setAction: (node) => setActionState(node),
      clear: () => {
        setLeftState(undefined);
        setActionState(undefined);
      },
    }),
    [],
  );

  return (
    <DashboardChromeDispatchContext.Provider value={dispatch}>
      <DashboardChromeStateContext.Provider value={{ left, action }}>
        {children}
      </DashboardChromeStateContext.Provider>
    </DashboardChromeDispatchContext.Provider>
  );
}

export function useDashboardChromeState() {
  const ctx = useContext(DashboardChromeStateContext);
  if (!ctx) throw new Error('useDashboardChromeState must be used within DashboardChromeProvider');
  return ctx;
}

export function useDashboardChromeDispatch() {
  const ctx = useContext(DashboardChromeDispatchContext);
  if (!ctx) throw new Error('useDashboardChromeDispatch must be used within DashboardChromeProvider');
  return ctx;
}

export function useDashboardHeaderSlots(params: {
  left?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const { setLeft, setAction, clear } = useDashboardChromeDispatch();

  // Avoid re-renders loops by only changing slots when deps change.
  const update = useCallback(() => {
    setLeft(params.left);
    setAction(params.action);
  }, [params.left, params.action, setLeft, setAction]);

  useEffect(() => {
    update();
    return () => clear();
  }, [update, clear]);
}

