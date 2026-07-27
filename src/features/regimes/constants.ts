import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ACTIVITY_FG, ACTIVITY_GRADIENTS } from '@/constants/activities';
import { Spacing } from '@/constants/theme';

import { type RegimeKind } from './types';

export const GUTTER = 52;
export const HOUR_HEIGHT = 62;
export const MIN_BLOCK_HEIGHT = 26;
export const POINT_HEIGHT = 30;
export const SCROLL_BOTTOM_PAD = Spacing.six;

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

// Extra gradients for kinds the tracker itself does not have.
const RITUAL_GRADIENT = ['#A98BF5', '#7A55E0'] as const;
const OTHER_GRADIENT = ['#8A9BB4', '#5B6b82'] as const;

interface KindStyle {
  colors: readonly [string, string];
  fg: string;
  icon: IconName;
}

export const KIND_STYLE: Record<RegimeKind, KindStyle> = {
  sleep: { colors: ACTIVITY_GRADIENTS.sleep, fg: ACTIVITY_FG.sleep, icon: 'moon-waning-crescent' },
  milk: { colors: ACTIVITY_GRADIENTS.feed, fg: ACTIVITY_FG.feed, icon: 'baby-bottle-outline' },
  meal: { colors: ACTIVITY_GRADIENTS.feed, fg: ACTIVITY_FG.feed, icon: 'silverware-fork-knife' },
  wake: { colors: ACTIVITY_GRADIENTS.awake, fg: ACTIVITY_FG.awake, icon: 'white-balance-sunny' },
  play: { colors: ACTIVITY_GRADIENTS.awake, fg: ACTIVITY_FG.awake, icon: 'baby-face-outline' },
  ritual: { colors: RITUAL_GRADIENT, fg: '#FFFFFF', icon: 'book-open-outline' },
  other: { colors: OTHER_GRADIENT, fg: '#FFFFFF', icon: 'star-four-points-outline' },
};

// Awake-window fill: yellow-lime block with just a sun icon.
export const AWAKE_FILL_GRADIENT = ['#CFE95C', '#EAF69B'] as const;
export const AWAKE_FILL_ICON = '#3F5406';
