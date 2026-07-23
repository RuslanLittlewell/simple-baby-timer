import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Dimensions } from 'react-native';

import { ACTIVITY_GRADIENTS } from '@/constants/activities';
import { Spacing } from '@/constants/theme';
import { type SessionKind } from '@/lib/activity-store';

export const GUTTER = 52;
export const NOW_COLOR = '#FF3B30';
export const DANGER_COLOR = '#FF6B6B';

export const ZOOM_MODES = [
  { step: 60, hourHeight: 40 },
  { step: 30, hourHeight: 60 },
  { step: 15, hourHeight: 96 },
  { step: 10, hourHeight: 144 },
  { step: 5, hourHeight: 264 },
];
export const DEFAULT_ZOOM = 2;
export const ZOOM_STEP_RATIO = 1.45;
export const ZOOM_BADGE_HOLD = 700;

export const SCROLL_BOTTOM_PAD = Spacing.six;

export const LANES: Record<SessionKind, number> = {
  sleep: 0,
  awake: 0,
  feeding: 1,
  poop: 2,
  diaper: 3,
};
export const LANE_INSET = 40;

export const MIN_EVENT_HEIGHT = 10;

export const STRIPE_PITCH = 12;
export const STRIPE_THICKNESS = 6;
export const STRIPE_SKEW = '-45deg';
export const SCREEN_WIDTH = Dimensions.get('window').width;

export interface KindMeta {
  gradKey: keyof typeof ACTIVITY_GRADIENTS;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

export const KIND_META: Record<SessionKind, KindMeta> = {
  sleep: { gradKey: 'sleep', icon: 'moon-waning-crescent' },
  feeding: { gradKey: 'feed', icon: 'baby-bottle-outline' },
  awake: { gradKey: 'awake', icon: 'white-balance-sunny' },
  poop: { gradKey: 'poop', icon: 'emoticon-poop' },
  diaper: { gradKey: 'diaper', icon: 'diaper-outline' },
};
