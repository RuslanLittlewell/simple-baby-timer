import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ACTIVITY_GRADIENTS } from '@/constants/activities';
import { type EventKind } from '@/lib/activity-store';
import { type ActivityKind } from '@/lib/notifications';

export type GradKey = keyof typeof ACTIVITY_GRADIENTS;
export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

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
  { id: 'sleep', gradKey: 'sleep', icon: 'moon-waning-crescent' },
  { id: 'feeding', gradKey: 'feed', icon: 'baby-bottle-outline' },
  { id: 'awake', gradKey: 'awake', icon: 'white-balance-sunny' },
];

export const MAIN_ACTIVITIES = ACTIVITIES.filter((a) => a.id !== 'feeding');
export const FEEDING = ACTIVITIES.find((a) => a.id === 'feeding')!;

export const EVENTS: EventMeta[] = [
  { id: 'poop', gradKey: 'poop', icon: 'emoticon-poop' },
  { id: 'diaper', gradKey: 'diaper', icon: 'diaper-outline' },
];
