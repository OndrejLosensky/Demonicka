import { createTheme } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';
import { tokens } from './theme/tokens';
import { getShadow, getDividerColor } from './theme/utils';

// Centralized theme builder for consistent spacing, typography and components
export function createAppTheme(mode: PaletteMode) {
  const isDark = mode === 'dark';

  return createTheme({
    spacing: 8,
    shape: {
      borderRadius: tokens.borderRadius.md,
    },
    palette: {
      mode,
      primary: {
        main: '#ff3b30',
        light: '#ff6a64',
        dark: '#c30000',
        contrastText: '#ffffff',
      },
      error: { main: '#e53935' },
      success: { main: '#2e7d32' },
      warning: { main: '#ed6c02' },
      background: {
        default: isDark ? '#0d1117' : '#fafafa',
        paper: isDark ? '#11161c' : '#ffffff',
      },
      text: {
        primary: isDark ? '#e6e8ee' : '#1a1a1a',
        secondary: isDark ? '#b8bcc7' : '#5f6368',
      },
    },
    typography: {
      fontFamily: `Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'`,
      h1: { fontSize: '3rem', fontWeight: 800, letterSpacing: -0.5 },
      h2: { fontSize: '2.25rem', fontWeight: 800, letterSpacing: -0.25 },
      h3: { fontSize: '1.75rem', fontWeight: 700 },
      h4: { fontSize: '1.5rem', fontWeight: 700 },
      h5: { fontSize: '1.25rem', fontWeight: 600 },
      h6: { fontSize: '1.125rem', fontWeight: 600 },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.6 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*': { outlineColor: 'transparent' },
          '*:focus-visible': {
            outline: `2px solid ${isDark ? '#ff6a64' : '#ff3b30'}`,
            outlineOffset: 2,
            borderRadius: tokens.borderRadius.xs,
          },
          '::selection': {
            background: isDark ? '#ff6a6433' : '#ff3b3033',
          },
          html: {
            backgroundColor: isDark ? '#0d1117' : '#fafafa',
            color: isDark ? '#e6e8ee' : '#1a1a1a',
          },
          body: {
            backgroundColor: isDark ? '#0d1117' : '#fafafa',
            color: isDark ? '#e6e8ee' : '#1a1a1a',
            margin: 0,
            padding: 0,
            minHeight: '100vh',
          },
          '#root': {
            backgroundColor: isDark ? '#0d1117' : '#fafafa',
            minHeight: '100vh',
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius.md,
            border: `1px solid ${getDividerColor(mode)}`,
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius.md,
            padding: 16,
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius.md,
            paddingInline: 16,
            paddingBlock: 10,
            transition: tokens.transitions.default,
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: getShadow('lg', mode),
            },
            '&:active': { transform: 'translateY(0)' },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius.md,
            transition: tokens.transitions.default,
            '&:hover': {
              backgroundColor: isDark ? getDividerColor(mode) : 'rgba(0,0,0,0.04)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: tokens.borderRadius.sm, fontWeight: 600 },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            cursor: 'pointer',
            textUnderlineOffset: 4,
            transition: tokens.transitions.default,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#141922' : '#f8f9fb',
          },
        },
      },
    },
  });
}


