import type { PaletteMode } from '@mui/material';
import { tokens } from './tokens';

/**
 * Get shadow by level and theme mode
 */
export function getShadow(
  level: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'card' | 'glow' | 'glowLight' | 'glowSubtle' | 'dropShadow' | 'dropShadowSm',
  mode: PaletteMode
): string {
  if (level === 'glow') return tokens.shadows.glow;
  if (level === 'glowLight') return tokens.shadows.glowLight;
  if (level === 'glowSubtle') return tokens.shadows.glowSubtle;
  if (level === 'dropShadow') return tokens.shadows.dropShadow;
  if (level === 'dropShadowSm') return tokens.shadows.dropShadowSm;
  if (level === 'card') return mode === 'dark' ? tokens.shadows.dark.card : tokens.shadows.card;
  return mode === 'dark' ? tokens.shadows.dark[level] : tokens.shadows[level];
}

/**
 * Get rgba color from hex with opacity
 */
export function getRgbaColor(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get divider border color for theme mode
 */
export function getDividerColor(mode: PaletteMode): string {
  return mode === 'dark' 
    ? `rgba(255, 255, 255, ${tokens.opacity.divider})`
    : `rgba(0, 0, 0, ${tokens.opacity.divider})`;
}

/**
 * Get background color with opacity for theme mode
 */
export function getBackgroundWithOpacity(color: string): string {
  return getRgbaColor(color, tokens.opacity.overlay);
}
