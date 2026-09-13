import { getAllSessionsForChild, getSessionsInRange } from '@/lib/activity-store';
import { ageInMonths, type Child } from '@/lib/children';
import {
  PERSONAL_REGIME_MIN_AGE_MONTHS,
  PERSONAL_REGIME_WINDOW_DAYS,
  buildPersonalRegime,
  hasRegimeHistory,
  type PersonalRegimeResult,
} from '@/lib/personal-regime';
import { flushQueue, syncChildHistory } from '@/lib/sync';
import { useAppStore } from '@/state/app-state';
import { usePersonalRegimeStore } from '@/state/personal-regime-state';

const DAY_MS = 86_400_000;
const HISTORY_WITHOUT_BIRTHDAY_DAYS = 365;

/** Sends pending local changes, then downloads the child's whole history again. */
export async function syncChildData(child: Child, now = Date.now()): Promise<void> {
  await flushQueue();
  if (!child.remoteId) return;
  const startMs = child.birthday ?? now - HISTORY_WITHOUT_BIRTHDAY_DAYS * DAY_MS;
  const applied = await syncChildHistory(child.remoteId, child.id, startMs, now, { refresh: true });
  if (applied > 0) useAppStore.getState().bumpDataVersion();
}

export async function isPersonalRegimeAvailable(child: Child, now = Date.now()): Promise<boolean> {
  if (child.birthday === undefined) return false;
  if (ageInMonths(child.birthday, now) < PERSONAL_REGIME_MIN_AGE_MONTHS) return false;
  return hasRegimeHistory(await getAllSessionsForChild(child.id), now);
}

export async function recalculatePersonalRegime(
  child: Child,
  now = Date.now(),
): Promise<PersonalRegimeResult> {
  // Two extra days cover the night before the first analysed day.
  const windowStart = now - (PERSONAL_REGIME_WINDOW_DAYS + 2) * DAY_MS;
  if (child.remoteId) {
    // Records logged on this device are already local, so going offline
    // only costs the other members' latest entries.
    const applied = await syncChildHistory(child.remoteId, child.id, windowStart, now).catch(() => 0);
    if (applied > 0) useAppStore.getState().bumpDataVersion();
  }
  const result = buildPersonalRegime(await getSessionsInRange(windowStart, now, child.id), now);
  if (result.ok) usePersonalRegimeStore.getState().setRegime(child.id, result.regime);
  return result;
}
