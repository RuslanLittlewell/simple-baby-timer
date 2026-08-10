import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { type ProDetails } from '@/lib/activity-store';

import { type Translate } from './helpers';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export type SettlingMethod = Extract<ProDetails, { type: 'settling' }>['methods'][number];

export const SETTLING_METHODS: SettlingMethod[] = [
  'rocking',
  'fitball',
  'inArms',
  'crib',
  'pacifier',
  'whiteNoise',
  'music',
  'swaddling',
  'darkRoom',
  'walk',
  'independent',
];
export const SLEEP_PLACES = [
  'crib',
  'stroller',
  'carSeat',
  'coSleeping',
  'carrier',
  'inArms',
] as const;
export const BREAST_SIDES = ['left', 'right', 'both'] as const;
export const BOTTLE_CONTENTS = ['formula', 'breastMilk'] as const;

const SLEEP_ICONS: Record<Extract<ProDetails, { type: 'sleep' }>['place'], IconName> = {
  crib: 'bed-single-outline',
  stroller: 'baby-carriage',
  carSeat: 'car-child-seat',
  coSleeping: 'bed-double-outline',
  carrier: 'kangaroo',
  inArms: 'mother-heart',
};

export function proDetailsIcon(details?: ProDetails): IconName | null {
  if (!details) return null;
  if (details.type === 'settling') return 'plus';
  if (details.type === 'sleep') return SLEEP_ICONS[details.place];
  return details.mode === 'breast' ? 'mother-heart' : 'baby-bottle-outline';
}

export function proDetailsLabels(details: ProDetails, t: Translate): string[] {
  if (details.type === 'settling') {
    return details.methods.map((method) => t(`pro.${method}`));
  }
  if (details.type === 'sleep') return [t(`pro.${details.place}`)];
  if (details.mode === 'breast') return [t('pro.breast'), t(`pro.${details.side}`)];
  return [
    t('pro.bottle'),
    t(`pro.${details.content}`),
    ...(details.volumeMl ? [`${details.volumeMl} ${t('unit.ml')}`] : []),
  ];
}

export function proDetailsLabel(details: ProDetails, t: Translate): string {
  return proDetailsLabels(details, t).join(' · ');
}
