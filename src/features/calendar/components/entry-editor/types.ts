import { type ActivitySession } from '@/lib/activity-store';

import { type Translate } from '../../helpers';
import { BOTTLE_CONTENTS, BREAST_SIDES, SLEEP_PLACES, type SettlingMethod } from '../../pro-details';

export type SleepPlace = (typeof SLEEP_PLACES)[number];
export type BreastSide = (typeof BREAST_SIDES)[number];
export type BottleContent = (typeof BOTTLE_CONTENTS)[number];
export type FeedingMode = 'breast' | 'bottle';
export type EditableProKind = 'settling' | 'sleep' | 'feeding' | null;

export interface EntryEditorProps {
  entry: ActivitySession | null;
  proActive: boolean;
  onClose: () => void;
  onChanged: () => void | Promise<void>;
}

export interface EntryEditorValues {
  startInput: string;
  endInput: string;
  startDayMs: number;
  endDayMs: number;
  milkInput: string;
  settlingMethods: SettlingMethod[];
  sleepPlace: SleepPlace;
  feedingMode: FeedingMode;
  breastSide: BreastSide;
  bottleContent: BottleContent;
}

export interface EditorTheme {
  text: string;
  textSecondary: string;
  border: string;
  background: string;
  backgroundElement: string;
  backgroundSelected: string;
  danger: string;
}

export interface TranslatedEditorProps {
  t: Translate;
}
