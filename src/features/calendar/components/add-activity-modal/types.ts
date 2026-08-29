import { type ProDetails, type SessionKind } from '@/lib/activity-store';

import { type Translate } from '../../helpers';
import { BOTTLE_CONTENTS, BREAST_SIDES, SLEEP_PLACES, type SettlingMethod } from '../../pro-details';

export type ManualKind = SessionKind;
export type FeedingMode = 'breast' | 'bottle';
export type SleepPlace = (typeof SLEEP_PLACES)[number];
export type BreastSide = (typeof BREAST_SIDES)[number];
export type BottleContent = (typeof BOTTLE_CONTENTS)[number];

export interface AddActivityModalProps {
  visible: boolean;
  day: Date;
  proActive: boolean;
  onClose: () => void;
  onSave: (
    kind: ManualKind,
    start: number,
    end: number,
    proDetails?: ProDetails,
    milkMl?: number,
  ) => Promise<void>;
}

export interface AddActivityFormValues {
  kind: ManualKind;
  startInput: string;
  endInput: string;
  startDayMs: number;
  endDayMs: number;
  sleepPlace: SleepPlace;
  feedingMode: FeedingMode;
  breastSide: BreastSide;
  bottleContent: BottleContent;
  volume: string;
  settlingMethods: SettlingMethod[];
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SectionTheme {
  text: string;
  textSecondary: string;
  border: string;
  background: string;
  backgroundElement: string;
  backgroundSelected: string;
}

export interface TranslatedSectionProps {
  t: Translate;
}
