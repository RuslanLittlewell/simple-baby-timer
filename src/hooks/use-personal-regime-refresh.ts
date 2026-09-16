import { useEffect } from 'react';
import { AppState } from 'react-native';

import { refreshPersonalRegime } from '@/features/settings/data-actions';
import {
  childrenDueForRegimeRun,
  msUntilNextLocalMidnight,
} from '@/lib/personal-regime-schedule';
import { hasProAccess } from '@/lib/pro-access';
import { useAppStore } from '@/state/app-state';
import { usePersonalRegimeStore } from '@/state/personal-regime-state';

/** The triggers overlap by design, so a child rebuilds one schedule at a time. */
const running = new Set<string>();

/** Before the saved days are read back, every child looks like it never ran. */
const hydrated = (): Promise<void> =>
  usePersonalRegimeStore.persist.hasHydrated()
    ? Promise.resolve()
    : new Promise((resolve) => {
        const unsubscribe = usePersonalRegimeStore.persist.onFinishHydration(() => {
          unsubscribe();
          resolve();
        });
      });

/**
 * Rebuilds every schedule the current day has not been counted into yet. A run
 * that throws leaves its day unmarked, so the next trigger takes it again.
 */
export async function refreshDuePersonalRegimes(now = Date.now()): Promise<void> {
  await hydrated();
  const appState = useAppStore.getState();
  const { authRequired, children } = appState;
  if (authRequired) return;
  const { lastRunDay } = usePersonalRegimeStore.getState();
  const due = childrenDueForRegimeRun(
    children.map((child) => ({
      childId: child.id,
      hasProAccess: hasProAccess(appState, child.id),
      lastRunDay: lastRunDay[child.id],
    })),
    now,
  );
  for (const child of children) {
    if (!due.includes(child.id) || running.has(child.id)) continue;
    running.add(child.id);
    try {
      await refreshPersonalRegime(child, now);
    } catch {
      // Offline or a failed read: the day stays open for the next trigger.
    } finally {
      running.delete(child.id);
    }
  }
}

/**
 * Keeps the personal schedules on the current day: at local midnight while the
 * app is open, and on the first foreground, sign-in or Pro unlock afterwards.
 */
export function usePersonalRegimeRefresh(): void {
  const accountId = useAppStore((state) => state.accountId);
  const authRequired = useAppStore((state) => state.authRequired);
  const proActive = useAppStore((state) => state.proActive);
  const childrenKey = useAppStore((state) =>
    state.children.map((child) => `${child.id}:${child.proEnabled === true}`).join(','),
  );

  useEffect(() => {
    if (authRequired) return;
    void refreshDuePersonalRegimes();
  }, [accountId, authRequired, proActive, childrenKey]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const scheduleMidnight = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void refreshDuePersonalRegimes().finally(scheduleMidnight);
      }, msUntilNextLocalMidnight(Date.now()));
    };
    scheduleMidnight();

    // A suspended phone runs no timers, so a missed midnight is caught up here.
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      void refreshDuePersonalRegimes();
      scheduleMidnight();
    });
    return () => {
      if (timer) clearTimeout(timer);
      subscription.remove();
    };
  }, []);
}
