/**
 * Design Tokens - Single source of truth for spacing, shadows, transitions, etc.
 */

export const tokens = {
  // Border Radius
  borderRadius: {
    xs: 2,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },

  // Shadows - Light mode
  shadows: {
    xs: '0 1px 2px rgba(0,0,0,0.05)',
    sm: '0 2px 4px rgba(0,0,0,0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 8px 20px rgba(0,0,0,0.08)',
    xl: '0 12px 32px rgba(0,0,0,0.15)',
    card: '0 2px 8px rgba(0,0,0,0.1)',
    glow: '0 0 20px rgba(255,59,48,0.3)',
    glowLight: '0 0 20px rgba(255,59,48,0.2)',
    glowSubtle: '0 0 15px rgba(255,59,48,0.15)',
    dropShadow: 'drop-shadow(0px 8px 24px rgba(0,0,0,0.12))',
    dropShadowSm: 'drop-shadow(0 0 10px rgba(0,0,0,0.1))',
    // Dark mode shadows
    dark: {
      xs: '0 1px 2px rgba(0,0,0,0.3)',
      sm: '0 2px 4px rgba(0,0,0,0.3)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      lg: '0 8px 20px rgba(0,0,0,0.4)',
      xl: '0 12px 32px rgba(0,0,0,0.5)',
      card: '0 2px 8px rgba(0,0,0,0.2)',
    },
  },

  // Transitions
  transitions: {
    fast: 'all 0.15s ease-in-out',
    default: 'all 0.2s ease-in-out',
    slow: 'all 0.3s ease-in-out',
  },

  // Z-index scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    overlay: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    header: 50,
  },

  // Container max widths
  maxWidth: {
    container: '1280px',
    content: '1200px',
  },

  // Opacity values
  opacity: {
    divider: 0.08,
    overlay: 0.95,
    hover: 0.04,
    hoverDark: 0.08,
  },

  // Blur values
  blur: {
    sm: '4px',
    md: '8px',
    lg: '16px',
  },
} as const;

export type Tokens = typeof tokens;
