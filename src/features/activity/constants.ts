import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ACTIVITY_GRADIENTS } from '@/constants/activities';
import { type EventKind } from '@/lib/activity-store';
import { type ActivityKind } from '@/lib/notifications';

export type GradKey = keyof typeof ACTIVITY_GRADIENTS.dark;
export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;



export const CARD_HEIGHT = 82;
export const COMPACT_CARD_HEIGHT = 68;
export const DENSE_CARD_HEIGHT = 54;

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

export const MAIN_ACTIVITIES = ACTIVITIES.filter(
  (activity): activity is ActivityMeta & { id: 'settling' | 'sleep' | 'awake' } =>
    activity.id === 'settling' || activity.id === 'sleep' || activity.id === 'awake',
);
export const SLEEP_ACTIVITY = ACTIVITIES.find((activity) => activity.id === 'sleep')!;
export const AWAKE_ACTIVITY = ACTIVITIES.find((activity) => activity.id === 'awake')!;
export const FEEDING = ACTIVITIES.find((a) => a.id === 'feeding')!;

export const EVENTS: EventMeta[] = [
  { id: 'diaper', gradKey: 'diaper', icon: 'diaper-outline' },
  { id: 'poop', gradKey: 'poop', icon: 'emoticon-poop' },
];

export const NIGHT_WAKING_EVENT: EventMeta = {
  id: 'nightWaking',
  gradKey: 'nightWaking',
  icon: 'power-sleep',
};
