

import '@/global.css';

import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark';

// "Morning Nursery" / "Night Nursery" token sets.
export const Colors = {
  light: {
    text: '#182230',
    background: '#F5F7FB',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E7EDF7',
    textSecondary: '#647184',
    textDisabled: '#98A3B2',
    surfaceElevated: '#EEF3FA',
    border: '#DCE3EC',
    primary: '#326FD1',
    primaryPressed: '#2458AA',
    navigationActive: '#E7EDF7',
    danger: '#D94B57',
  },
  dark: {
    text: '#F6F8FB',
    background: '#0B1220',
    backgroundElement: '#151E2B',
    backgroundSelected: '#29364A',
    textSecondary: '#A9B4C2',
    textDisabled: '#6E7A89',
    surfaceElevated: '#1C2838',
    border: '#2B394B',
    primary: '#79A9FF',
    primaryPressed: '#5D8BE0',
    navigationActive: '#29364A',
    danger: '#FF7A83',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const BackgroundGradient: Record<
  ThemeMode,
  { colors: readonly [string, string, ...string[]]; locations: readonly [number, number, ...number[]] }
> = {
  dark: {
    colors: ['#0B1220', '#101A2C', '#18142D'],
    locations: [0, 0.58, 1],
  },
  light: {
    colors: ['#F5F7FB', '#FAF7FF'],
    locations: [0, 1],
  },
};

export const Fonts = Platform.select({
  ios: {

    sans: 'system-ui',

    serif: 'ui-serif',

    rounded: 'ui-rounded',

    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
