import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ACTIVITY_GRADIENTS } from '@/constants/activities';
import { type EventKind } from '@/lib/activity-store';
import { type ActivityKind } from '@/lib/notifications';

export type GradKey = keyof typeof ACTIVITY_GRADIENTS.dark;
export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

// Shared row height for the bottom row (feeding / diaper / poop) so the wide
// ActivityRow and the two narrow EventTiles line up exactly.
export const CARD_HEIGHT = 82;

export interface ActivityMeta {
  id: ActivityKind;
  gradKey: GradKey;
  icon: IconName;
}

export interface EventMeta {
  id: EventKind;
  gradKey: GradKey;
  icon: IconName;
}

export const ACTIVITIES: ActivityMeta[] = [
  { id: 'settling', gradKey: 'settling', icon: 'sleep' },
  { id: 'sleep', gradKey: 'sleep', icon: 'moon-waning-crescent' },
  { id: 'feeding', gradKey: 'feed', icon: 'baby-bottle-outline' },
  { id: 'awake', gradKey: 'awake', icon: 'white-balance-sunny' },
];

export const MAIN_ACTIVITIES = ACTIVITIES.filter((a) => a.id === 'sleep' || a.id === 'awake');
export const FEEDING = ACTIVITIES.find((a) => a.id === 'feeding')!;

export const EVENTS: EventMeta[] = [
  { id: 'diaper', gradKey: 'diaper', icon: 'diaper-outline' },
  { id: 'poop', gradKey: 'poop', icon: 'emoticon-poop' },
];
