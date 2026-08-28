import AsyncStorage from '@react-native-async-storage/async-storage';
import { isRunningInExpoGo } from 'expo';
import * as LiveActivity from 'expo-live-activity';
import { Platform } from 'react-native';

import { ACTIVITY_ACCENT } from '@/constants/activities';
import { liveActivityKey, planLiveActivityReconciliation } from '@/lib/live-activity-lifecycle';
import { type ActivityKind } from '@/lib/notifications';

const STORAGE_KEY = 'babytimer.live-activities.v2';

const ICONS: Record<ActivityKind, string> = {
  settling: 'la-settling', sleep: 'la-sleep', feeding: 'la-feed', awake: 'la-awake',
};
const TINTS: Record<ActivityKind, string> = {
  settling: ACTIVITY_ACCENT.dark.settling,
  sleep: ACTIVITY_ACCENT.dark.sleep,
  feeding: ACTIVITY_ACCENT.dark.feed,
  awake: ACTIVITY_ACCENT.dark.awake,
};

export const liveActivitySupported = Platform.OS === 'ios' && !isRunningInExpoGo();
export type LiveSlot = 'session' | 'feeding';

type Labels = { title: string; subtitle?: string };
export type DesiredLiveActivity = {
  ownerId: string;
  slot: LiveSlot;
  kind: ActivityKind;
  startedAt: number;
  labels: Labels;
};
type StoredLiveActivity = DesiredLiveActivity & { id: string };

let records: Record<string, StoredLiveActivity> = {};
let hydration: Promise<void> | null = null;
let operationTail: Promise<void> = Promise.resolve();

const recordKey = (ownerId: string, slot: LiveSlot) => liveActivityKey({ ownerId, slot });
const isStoredRecord = (value: unknown): value is StoredLiveActivity => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<StoredLiveActivity>;
  return typeof item.id === 'string' && typeof item.ownerId === 'string' &&
    (item.slot === 'session' || item.slot === 'feeding') &&
    ['settling', 'sleep', 'feeding', 'awake'].includes(item.kind ?? '') &&
    typeof item.startedAt === 'number' && !!item.labels && typeof item.labels.title === 'string';
};

const hydrate = async () => {
  if (!liveActivitySupported) return;
  if (!hydration) {
    hydration = AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      records = Object.fromEntries(
        parsed.filter(isStoredRecord).map((record) => [recordKey(record.ownerId, record.slot), record]),
      );
    }).catch(() => { records = {}; });
  }
  await hydration;
};
const persist = () => AsyncStorage
  .setItem(STORAGE_KEY, JSON.stringify(Object.values(records)))
  .catch(() => {});
const enqueue = (operation: () => Promise<void> | void) => {
  operationTail = operationTail.then(async () => {
    await hydrate();
    await operation();
  }).catch(() => {});
  return operationTail;
};

const stateFor = (kind: ActivityKind, startedAt: number, labels: Labels): LiveActivity.LiveActivityState => ({
  title: labels.title,
  subtitle: labels.subtitle,
  progressBar: { elapsedTimer: { startDate: startedAt } },
  imageName: ICONS[kind],
  dynamicIslandImageName: ICONS[kind],
});
const stopRecord = (key: string) => {
  const record = records[key];
  if (!record) return;
  try {
    LiveActivity.stopActivity(record.id, {
      title: record.labels.title,
      subtitle: record.labels.subtitle,
    });
  } catch {
    // A missing native activity is already stopped.
  }
  delete records[key];
};
const startRecord = (desired: DesiredLiveActivity) => {
  const id = LiveActivity.startActivity(stateFor(desired.kind, desired.startedAt, desired.labels), {
    timerType: 'digital',
    backgroundColor: '#000000',
    titleColor: '#FFFFFF',
    subtitleColor: '#B0B4BA',
    progressViewTint: TINTS[desired.kind],
    progressViewLabelColor: '#FFFFFF',
    deepLinkUrl: 'babytimer://',
    padding: { vertical: 6, horizontal: 10 },
    imageSize: { width: 28, height: 28 },
  });
  if (id) records[recordKey(desired.ownerId, desired.slot)] = { ...desired, id };
};

export function startLiveActivity(
  slot: LiveSlot,
  kind: ActivityKind,
  startedAt: number,
  labels: Labels,
  ownerId = 'current',
) {
  if (!liveActivitySupported) return;
  void enqueue(() => {
    const key = recordKey(ownerId, slot);
    const current = records[key];
    if (current?.kind === kind && current.startedAt === startedAt) return;
    stopRecord(key);
    startRecord({ ownerId, slot, kind, startedAt, labels });
    return persist();
  });
}

export function stopLiveActivity(slot: LiveSlot, ownerId?: string) {
  if (!liveActivitySupported) return;
  void enqueue(() => {
    const keys = ownerId
      ? [recordKey(ownerId, slot)]
      : Object.keys(records).filter((key) => records[key]?.slot === slot);
    for (const key of keys) stopRecord(key);
    return persist();
  });
}

export function rememberRemoteLiveActivity(ownerId: string, slot: LiveSlot, id: string) {
  if (!liveActivitySupported) return;
  void enqueue(() => {
    const key = recordKey(ownerId, slot);
    const previous = records[key];
    if (previous && previous.id !== id) stopRecord(key);
    records[key] = previous
      ? { ...previous, id }
      : { id, ownerId, slot, kind: slot === 'feeding' ? 'feeding' : 'awake', startedAt: 0, labels: { title: '' } };
    return persist();
  });
}

export function forgetLiveActivity(id: string) {
  if (!liveActivitySupported) return;
  void enqueue(() => {
    for (const [key, record] of Object.entries(records)) {
      if (record.id === id) delete records[key];
    }
    return persist();
  });
}

export function reconcileLiveActivities(desiredList: DesiredLiveActivity[]) {
  if (!liveActivitySupported) return Promise.resolve();
  return enqueue(() => {
    const plan = planLiveActivityReconciliation(Object.values(records), desiredList);
    for (const key of plan.stopKeys) stopRecord(key);
    for (const { key, desired } of plan.adopt) records[key] = { ...desired, id: records[key].id };
    for (const target of plan.start) startRecord(target);
    return persist();
  });
}
