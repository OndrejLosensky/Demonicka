import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import type { PaletteMode } from '@mui/material';
import { createAppTheme } from '../theme';
import { api } from '../services/api';

interface ThemeCtx {
  mode: PaletteMode;
  toggleMode: () => void;
  setMode: (next: PaletteMode, opts?: { persistToServer?: boolean }) => void;
}

const Ctx = createContext<ThemeCtx | undefined>(undefined);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('app_theme');
    if (stored === 'light' || stored === 'dark') setMode(stored);
  }, []);

  const setModeWithSideEffects = useCallback(
    (next: PaletteMode, opts?: { persistToServer?: boolean }) => {
      setMode(next);
      localStorage.setItem('app_theme', next);

      const shouldPersist = opts?.persistToServer ?? false;
      const token = localStorage.getItem('access_token');
      if (shouldPersist && token) {
        void api
          .patch('/users/me/settings', { preferredTheme: next })
          .catch(() => {
            // Non-blocking: keep UI responsive even if persistence fails.
          });
      }
    },
    [],
  );

  const toggleMode = useCallback(() => {
    const next = mode === 'light' ? 'dark' : 'light';
    setModeWithSideEffects(next, { persistToServer: true });
  }, [mode, setModeWithSideEffects]);

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <Ctx.Provider value={{ mode, toggleMode, setMode: setModeWithSideEffects }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </Ctx.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppTheme must be used within AppThemeProvider');
  return ctx;
}


