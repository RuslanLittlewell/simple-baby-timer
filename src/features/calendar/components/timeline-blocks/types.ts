import { type ComponentProps } from 'react';
import { type LinearGradient } from 'expo-linear-gradient';

import { type ActivitySession } from '@/lib/activity-store';
import { type ActivityKind } from '@/lib/notifications';

import { type Translate } from '../../helpers';

export interface TimelineBlocksProps {
  sessions: ActivitySession[];
  hourHeight: number;
  dayStartMs: number;
  onEdit: (entry: ActivitySession) => void;
  t: Translate;
}

export interface LiveBlock {
  kind: ActivityKind;
  start: number;
  top: number;
  height: number;
  proDetails?: ActivitySession['proDetails'];
}

export interface LiveBlocksProps {
  blocks: LiveBlock[];
  t: Translate;
}

export interface SessionLayout {
  top: number;
  spanHeight: number;
  visibleStart: number;
  visibleEnd: number;
}

export type TimelineGradient = ComponentProps<typeof LinearGradient>['colors'];
