

import '@/global.css';

import { Platform, type TextStyle } from 'react-native';

export type ThemeMode = 'light' | 'dark';


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
    screen: '#F4F5FA',
    textMuted: '#6E6888',
    panel: '#FFFFFF',
    hairline: 'rgba(24,34,48,0.09)',
    statusCard: '#ECE7F7',
    statusCardBorder: 'rgba(124,92,214,0.18)',
    statusAccent: '#6B54B8',
    premium: '#6B54B8',
    premiumBorder: 'rgba(107,84,184,0.45)',
  },
  dark: {
    text: '#F6F3FA',
    background: '#16121D',
    backgroundElement: '#221B2D',
    backgroundSelected: '#3A3049',
    textSecondary: '#A39EBB',
    textDisabled: '#6F6884',
    surfaceElevated: '#2A2238',
    border: '#3A3150',
    primary: '#C3B1F5',
    primaryPressed: '#A892E6',
    navigationActive: '#3A3049',
    danger: '#FF7A83',
    screen: '#16121D',
    textMuted: '#A39EBB',
    panel: '#221B2D',
    hairline: 'rgba(196,181,253,0.12)',
    statusCard: '#2A2238',
    statusCardBorder: 'rgba(196,181,253,0.14)',
    statusAccent: '#B9A6EC',
    premium: '#D3C4FF',
    premiumBorder: 'rgba(211,196,255,0.5)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const BackgroundGradient: Record<
  ThemeMode,
  { colors: readonly [string, string, ...string[]]; locations: readonly [number, number, ...number[]] }
> = {
  dark: {
    colors: ['#16121D', '#1A1524', '#201829'],
    locations: [0, 0.58, 1],
  },
  light: {
    colors: ['#F5F7FB', '#FAF7FF'],
    locations: [0, 1],
  },
};




export const PurpleGradient = ['#4C1D95', '#7C3AED', '#C026D3'] as const;

export const NunitoSans = {
  regular: 'NunitoSans_400Regular',
  medium: 'NunitoSans_500Medium',
  semiBold: 'NunitoSans_600SemiBold',
  bold: 'NunitoSans_700Bold',
} as const;

export const GoogleSansFlex = {
  regular: 'GoogleSansFlex_400Regular',
  medium: 'GoogleSansFlex_500Medium',
  semiBold: 'GoogleSansFlex_600SemiBold',
  bold: 'GoogleSansFlex_700Bold',
} as const;

/** The family every text uses; both families are loaded, so switching is this one line. */
export const AppFont = NunitoSans;

export const TimerFont = GoogleSansFlex.bold;

export function fontFamilyForWeight(weight?: TextStyle['fontWeight']): string {
  if (weight === 'bold') return AppFont.bold;
  const numeric = typeof weight === 'number' ? weight : Number.parseInt(weight ?? '', 10);
  if (numeric >= 700) return AppFont.bold;
  if (numeric >= 600) return AppFont.semiBold;
  if (numeric >= 500) return AppFont.medium;
  return AppFont.regular;
}

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

// iOS screens run under the translucent tab bar; Android's tab bar takes its own space.
export const BottomTabInset = Platform.select({ ios: 50, android: 0 }) ?? 0;
export const MaxContentWidth = 800;
