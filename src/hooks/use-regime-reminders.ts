import { useEffect } from 'react';
import { AppState } from 'react-native';

import { translate } from '@/i18n';
import { cancelReminder, scheduleActivityNotification } from '@/lib/notifications';
import { hasProAccess, selectActiveChildProAccess } from '@/lib/pro-access';
import { planRegimeReminders, regimeReminderTime } from '@/lib/regime-reminders';
import { useAppStore } from '@/state/app-state';
import {
  usePersonalRegimeStore,
  type ScheduledRegimeReminder,
} from '@/state/personal-regime-state';

/**
 * Holds the system's notifications to what the schedule currently says: one
 * before every nap and before the night, and none while the schedule is
 * hidden. Reminders already handed over are kept as they are, so the plan is
 * only ever changed where it differs.
 */
export async function reconcileRegimeReminders(now = Date.now()): Promise<void> {
  const appState = useAppStore.getState();
  const { activeChildId, authRequired, children, language } = appState;
  const regimeState = usePersonalRegimeStore.getState();
  const child = children.find((item) => item.id === activeChildId);
  const regime = child ? regimeState.regimes[child.id] : undefined;
  const hasAccess = hasProAccess(appState);
  const wanted =
    regime && regimeState.ghostVisible && hasAccess && !authRequired
      ? planRegimeReminders(regime, now)
      : [];

  const kept: ScheduledRegimeReminder[] = [];
  for (const scheduled of regimeState.settlingReminders) {
    // Its time has passed: the system has either shown it or dropped it.
    if (scheduled.at <= now) continue;
    if (scheduled.language === language && wanted.some((plan) => plan.at === scheduled.at)) {
      kept.push(scheduled);
      continue;
    }
    await cancelReminder(scheduled.id);
  }

  const added: ScheduledRegimeReminder[] = [];
  for (const plan of wanted) {
    if (kept.some((scheduled) => scheduled.at === plan.at)) continue;
    const id = await scheduleActivityNotification(
      {
        title: translate(language, 'notif.regimeSettling.title'),
        body: translate(language, 'notif.regimeSettling.body', {
          time: regimeReminderTime(plan.settlingStartMin),
        }),
      },
      (plan.at - now) / 1000,
    );
    if (id) added.push({ at: plan.at, id, language });
  }

  usePersonalRegimeStore
    .getState()
    .setSettlingReminders([...kept, ...added].sort((a, b) => a.at - b.at));
}

/** The triggers overlap, and two passes at once would double the reminders. */
let pending: Promise<void> = Promise.resolve();

export function queueRegimeReminderSync(): Promise<void> {
  pending = pending.catch(() => {}).then(() => reconcileRegimeReminders());
  return pending;
}

export function useRegimeReminders(): void {
  const activeChildId = useAppStore((state) => state.activeChildId);
  const authRequired = useAppStore((state) => state.authRequired);
  const language = useAppStore((state) => state.language);
  const proAccess = useAppStore(selectActiveChildProAccess);
  const ghostVisible = usePersonalRegimeStore((state) => state.ghostVisible);
  const regime = usePersonalRegimeStore((state) =>
    activeChildId ? state.regimes[activeChildId] : undefined,
  );

  useEffect(() => {
    void queueRegimeReminderSync();
  }, [activeChildId, authRequired, ghostVisible, language, proAccess, regime]);

  useEffect(() => {
    // Only a day of reminders is ever pending, so coming back arms the next.
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void queueRegimeReminderSync();
    });
    return () => subscription.remove();
  }, []);
}
