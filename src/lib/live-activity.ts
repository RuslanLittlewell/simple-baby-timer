import * as LiveActivity from 'expo-live-activity';
import { Platform } from 'react-native';

import { ACTIVITY_ACCENT } from '@/constants/activities';
import { type ActivityKind } from '@/lib/notifications';


const ICONS: Record<ActivityKind, string> = {
  settling: 'la-settling',
  sleep: 'la-sleep',
  feeding: 'la-feed',
  awake: 'la-awake',
};



const TINTS: Record<ActivityKind, string> = {
  settling: ACTIVITY_ACCENT.dark.settling,
  sleep: ACTIVITY_ACCENT.dark.sleep,
  feeding: ACTIVITY_ACCENT.dark.feed,
  awake: ACTIVITY_ACCENT.dark.awake,
};

export const liveActivitySupported = Platform.OS === 'ios';

type Labels = {
  title: string;
  subtitle?: string;
};

export type LiveSlot = 'session' | 'feeding';

const activeIds: Record<LiveSlot, string | null> = { session: null, feeding: null };
const activeLabels: Record<LiveSlot, Labels | null> = { session: null, feeding: null };




const stateFor = (
  kind: ActivityKind,
  startedAt: number,
  labels: Labels,
): LiveActivity.LiveActivityState => ({
  title: labels.title,
  subtitle: labels.subtitle,
  progressBar: { elapsedTimer: { startDate: startedAt } },
  imageName: ICONS[kind],
  dynamicIslandImageName: ICONS[kind],
});

export function startLiveActivity(
  slot: LiveSlot,
  kind: ActivityKind,
  startedAt: number,
  labels: Labels,
) {
  if (!liveActivitySupported) return;
  stopLiveActivity(slot);
  activeLabels[slot] = labels;
  try {
    activeIds[slot] =
      LiveActivity.startActivity(stateFor(kind, startedAt, labels), {
        timerType: 'digital',
        backgroundColor: '#000000',
        titleColor: '#FFFFFF',
        subtitleColor: '#B0B4BA',
        progressViewTint: TINTS[kind],
        progressViewLabelColor: '#FFFFFF',
        deepLinkUrl: 'babytimer://',
        
        
        padding: { vertical: 6, horizontal: 10 },
        imageSize: { width: 28, height: 28 },
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
