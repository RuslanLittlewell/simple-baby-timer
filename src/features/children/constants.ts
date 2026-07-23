import { type ChildGradientKey } from '@/lib/children';

export const CHILD_GRADIENTS: Record<ChildGradientKey, readonly [string, string]> = {
  sky: ['#5B9BE8', '#2A5CC8'],
  rose: ['#F27BA5', '#D4457E'],
  mint: ['#5ED6A2', '#2FA876'],
  sun: ['#FFC65C', '#F09A3E'],
  lilac: ['#A98BF5', '#7A55E0'],
};

export const CHILD_GRADIENT_FG: Record<ChildGradientKey, string> = {
  sky: '#FFFFFF',
  rose: '#FFFFFF',
  mint: '#0E3B29',
  sun: '#5A3E00',
  lilac: '#FFFFFF',
};
