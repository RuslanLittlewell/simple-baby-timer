export type LiveActivityIdentity = {
  ownerId: string;
  slot: 'session' | 'feeding';
  kind: string;
  startedAt: number;
};

export type LiveActivityPlan<TDesired extends LiveActivityIdentity> = {
  stopKeys: string[];
  adopt: { key: string; desired: TDesired }[];
  start: TDesired[];
};

export const liveActivityKey = (item: Pick<LiveActivityIdentity, 'ownerId' | 'slot'>) =>
  `${item.ownerId}|${item.slot}`;

export function planLiveActivityReconciliation<
  TCurrent extends LiveActivityIdentity,
  TDesired extends LiveActivityIdentity,
>(currentList: TCurrent[], desiredList: TDesired[]): LiveActivityPlan<TDesired> {
  const desired = new Map(desiredList.map((item) => [liveActivityKey(item), item]));
  const retained = new Set<string>();
  const stopKeys: string[] = [];
  const adopt: { key: string; desired: TDesired }[] = [];

  for (const current of currentList) {
    const key = liveActivityKey(current);
    const target = desired.get(key);
    if (!target) {
      stopKeys.push(key);
    } else if (current.startedAt === 0) {
      retained.add(key);
      adopt.push({ key, desired: target });
    } else if (current.kind === target.kind && current.startedAt === target.startedAt) {
      retained.add(key);
    } else {
      stopKeys.push(key);
    }
  }

  return {
    stopKeys,
    adopt,
    start: [...desired.entries()]
      .filter(([key]) => !retained.has(key))
      .map(([, item]) => item),
  };
}
