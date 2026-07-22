import * as LiveActivity from 'expo-live-activity';
import { Platform } from 'react-native';

import { ACTIVITY_ACCENT } from '@/constants/activities';
import { type ActivityKind } from '@/lib/notifications';


const ICONS: Record<ActivityKind, string> = {
  sleep: 'la-sleep',
  feeding: 'la-feed',
  awake: 'la-awake',
};

const TINTS: Record<ActivityKind, string> = {
  sleep: ACTIVITY_ACCENT.sleep,
  feeding: ACTIVITY_ACCENT.feed,
  awake: ACTIVITY_ACCENT.awake,
};

export const liveActivitySupported = Platform.OS === 'ios';

type Labels = {
  title: string;
  subtitle: string;
};

export type LiveSlot = 'session' | 'feeding';

const activeIds: Record<LiveSlot, string | null> = { session: null, feeding: null };
const activeLabels: Record<LiveSlot, Labels | null> = { session: null, feeding: null };

const stateFor = (kind: ActivityKind, deadline: number, labels: Labels): LiveActivity.LiveActivityState => ({
  title: labels.title,
  subtitle: labels.subtitle,
  progressBar: { date: deadline },
  imageName: ICONS[kind],
  dynamicIslandImageName: ICONS[kind],
});

export function startLiveActivity(
  slot: LiveSlot,
  kind: ActivityKind,
  deadline: number,
  labels: Labels,
) {
  if (!liveActivitySupported) return;
  stopLiveActivity(slot);
  activeLabels[slot] = labels;
  try {
    activeIds[slot] =
      LiveActivity.startActivity(stateFor(kind, deadline, labels), {
        timerType: 'digital',
        backgroundColor: '#000000',
        titleColor: '#FFFFFF',
        subtitleColor: '#B0B4BA',
        progressViewTint: TINTS[kind],
        progressViewLabelColor: '#FFFFFF',
        deepLinkUrl: 'babytimer://',
      }) ?? null;
  } catch {
    activeIds[slot] = null;
  }
}

export function stopLiveActivity(slot: LiveSlot) {
  const id = activeIds[slot];
  if (!liveActivitySupported || !id) return;
  try {
    LiveActivity.stopActivity(id, {
      title: activeLabels[slot]?.title ?? '',
      subtitle: activeLabels[slot]?.subtitle,
    });
  } catch {
  }
  activeIds[slot] = null;
  activeLabels[slot] = null;
}
