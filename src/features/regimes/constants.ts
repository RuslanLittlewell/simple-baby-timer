import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Spacing } from '@/constants/theme';
import { useActivityColors } from '@/hooks/use-activity-colors';

import { type RegimeKind } from './types';

export const GUTTER = 52;
export const HOUR_HEIGHT = 62;
export const MIN_BLOCK_HEIGHT = 26;
export const POINT_HEIGHT = 30;
export const SCROLL_BOTTOM_PAD = Spacing.six;

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;


const RITUAL_GRADIENT = ['#A98BF5', '#7A55E0'] as const;
const OTHER_GRADIENT = ['#8A9BB4', '#5B6b82'] as const;

interface KindStyle {
  colors: readonly [string, string];
  fg: string;
  icon: IconName;
}

export function useKindStyle(): Record<RegimeKind, KindStyle> {
  const { gradients, fg } = useActivityColors();
  return {
    sleep: { colors: gradients.sleep, fg: fg.sleep, icon: 'moon-waning-crescent' },
    milk: { colors: gradients.feed, fg: fg.feed, icon: 'baby-bottle-outline' },
    meal: { colors: gradients.feed, fg: fg.feed, icon: 'silverware-fork-knife' },
    wake: { colors: gradients.awake, fg: fg.awake, icon: 'white-balance-sunny' },
    play: { colors: gradients.awake, fg: fg.awake, icon: 'baby-face-outline' },
    ritual: { colors: RITUAL_GRADIENT, fg: '#FFFFFF', icon: 'book-open-outline' },
    other: { colors: OTHER_GRADIENT, fg: '#FFFFFF', icon: 'star-four-points-outline' },
  };
}


export const AWAKE_FILL_GRADIENT = ['#CFE95C', '#EAF69B'] as const;
export const AWAKE_FILL_ICON = '#3F5406';
