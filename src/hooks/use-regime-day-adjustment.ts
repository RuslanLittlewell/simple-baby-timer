import { useEffect } from 'react';
import { AppState } from 'react-native';

import { getSessionsInRange, subscribeToSessionChanges } from '@/lib/activity-store';
import { type DaySleep } from '@/lib/personal-regime-adjustment';
import { useAppStore, type RemoteLive, type Session } from '@/state/app-state';
import { usePersonalRegimeStore } from '@/state/personal-regime-state';

/** Reaches back far enough to glue a night sleep interrupted before midnight. */
const LOOKBACK_MS = 12 * 60 * 60_000;
/** Overlap resolution writes several sessions in a row; they settle into one pass. */
const DEBOUNCE_MS = 250;

function runningSleepStart(
  childId: string,
  session: Session,
  remoteLive: RemoteLive[],
): number | null {
  if (session?.kind === 'sleep' && session.childId === childId) return session.startedAt;
  const remote = remoteLive.find(
    (item) => item.childId === childId && item.track === 'session' && item.kind === 'sleep',
  );
  return remote?.startedAt ?? null;
}

async function recalculatePass(): Promise<void> {
  if (!usePersonalRegimeStore.persist.hasHydrated()) return;
  const now = Date.now();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const { regimes } = usePersonalRegimeStore.getState();
  for (const childId of Object.keys(regimes)) {
    const stored = await getSessionsInRange(dayStart.getTime() - LOOKBACK_MS, now + 1, childId);
    const sleeps: DaySleep[] = stored
      .filter((session) => session.kind === 'sleep')
      .map((session) => ({ start: session.start, end: session.end }));
    const { session, remoteLive } = useAppStore.getState();
    const running = runningSleepStart(childId, session, remoteLive);
    if (running !== null) sleeps.push({ start: running, end: null });
    usePersonalRegimeStore.getState().recalculateDailyAdjustment(childId, sleeps, now);
  }
}

let tail: Promise<void> = Promise.resolve();
let timer: ReturnType<typeof setTimeout> | null = null;

function scheduleRecalculation() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    tail = tail.then(recalculatePass).catch(() => {});
  }, DEBOUNCE_MS);
}

/**
 * Keeps today's regime shifts in step with the recorded sleeps: any added,
 * edited, deleted or synced sleep, and any sleep starting or stopping, rebuilds them.
 */
export function useRegimeDayAdjustment(): void {
  useEffect(() => {
    scheduleRecalculation();
    const unsubscribeSessions = subscribeToSessionChanges(scheduleRecalculation);
    const unsubscribeApp = useAppStore.subscribe((state, previous) => {
      if (state.session !== previous.session || state.remoteLive !== previous.remoteLive) {
        scheduleRecalculation();
      }
    });
    const unsubscribeRegimes = usePersonalRegimeStore.subscribe((state, previous) => {
      if (state.regimes !== previous.regimes) scheduleRecalculation();
    });
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active') scheduleRecalculation();
    });
    return () => {
      unsubscribeSessions();
      unsubscribeApp();
      unsubscribeRegimes();
      appState.remove();
      if (timer) clearTimeout(timer);
    };
  }, []);
}
