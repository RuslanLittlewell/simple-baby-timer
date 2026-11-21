import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { AppState } from 'react-native';

import { recalculateRegimeDayProgress } from '@/hooks/use-regime-day-adjustment';
import { queueRegimeReminderSync } from '@/hooks/use-regime-reminders';
import { syncAfterRemoteChange } from '@/hooks/use-sync';
import { backgroundPushSupported, REMOTE_CHANGE_TASK } from '@/lib/background-push';
import { parseRemoteChange } from '@/lib/remote-change';
import { useAppStore } from '@/state/app-state';
import { usePersonalRegimeStore } from '@/state/personal-regime-state';

const { BackgroundNotificationTaskResult } = Notifications;

const TASK_BUDGET_MS = 25_000;

interface PersistedStore {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (listener: () => void) => () => void;
  };
}

function whenHydrated(store: PersistedStore): Promise<void> {
  if (store.persist.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsubscribe = store.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}

function withinBudget<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('background sync timed out')), TASK_BUDGET_MS);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

async function applyRemoteChange(remoteChildId: string): Promise<boolean> {
  await Promise.all([whenHydrated(useAppStore), whenHydrated(usePersonalRegimeStore)]);
  if (!(await syncAfterRemoteChange(remoteChildId))) return false;
  await recalculateRegimeDayProgress();
  await queueRegimeReminderSync();
  return true;
}

if (backgroundPushSupported) {
  TaskManager.defineTask<Notifications.NotificationTaskPayload>(
    REMOTE_CHANGE_TASK,
    async ({ data }) => {
      const change = parseRemoteChange(data);
      if (!change || AppState.currentState === 'active') {
        return BackgroundNotificationTaskResult.NoData;
      }
      try {
        return (await withinBudget(applyRemoteChange(change.childId)))
          ? BackgroundNotificationTaskResult.NewData
          : BackgroundNotificationTaskResult.NoData;
      } catch {
        return BackgroundNotificationTaskResult.Failed;
      }
    },
  );
  Notifications.registerTaskAsync(REMOTE_CHANGE_TASK).catch(() => {});
}
