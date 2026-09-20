import {
  getAllSessionsForChild,
  getSessionsInRange,
} from "@/lib/activity-store";
import { ageInMonths, type Child } from "@/lib/children";
import {
  PERSONAL_REGIME_MIN_AGE_MONTHS,
  PERSONAL_REGIME_WINDOW_DAYS,
  buildPersonalRegime,
  hasRegimeHistory,
  type PersonalRegimeResult,
} from "@/lib/personal-regime";
import { localDayKey } from "@/lib/personal-regime-schedule";
import { flushQueue, syncChildHistory } from "@/lib/sync";
import { useAppStore } from "@/state/app-state";
import { usePersonalRegimeStore } from "@/state/personal-regime-state";

const DAY_MS = 86_400_000;
const HISTORY_WITHOUT_BIRTHDAY_DAYS = 365;

export async function syncChildData(
  child: Child,
  now = Date.now(),
): Promise<void> {
  await flushQueue();
  if (!child.remoteId) return;
  const startMs =
    child.birthday ?? now - HISTORY_WITHOUT_BIRTHDAY_DAYS * DAY_MS;
  const applied = await syncChildHistory(
    child.remoteId,
    child.id,
    startMs,
    now,
    { refresh: true },
  );
  if (applied > 0) useAppStore.getState().bumpDataVersion();
}

export async function isPersonalRegimeAvailable(
  child: Child,
  now = Date.now(),
): Promise<boolean> {
  if (child.birthday === undefined) return false;
  if (ageInMonths(child.birthday, now) < PERSONAL_REGIME_MIN_AGE_MONTHS)
    return false;
  return hasRegimeHistory(await getAllSessionsForChild(child.id), now);
}

const regimeWindowStart = (now: number) =>
  now - (PERSONAL_REGIME_WINDOW_DAYS + 2) * DAY_MS;

async function pullRegimeWindow(child: Child, now: number): Promise<void> {
  if (!child.remoteId) return;
  const applied = await syncChildHistory(
    child.remoteId,
    child.id,
    regimeWindowStart(now),
    now,
  ).catch(() => 0);
  if (applied > 0) useAppStore.getState().bumpDataVersion();
}

async function buildFromLocalRecords(
  child: Child,
  now: number,
): Promise<PersonalRegimeResult> {
  const result = buildPersonalRegime(
    await getSessionsInRange(regimeWindowStart(now), now, child.id),
    now,
  );
  const store = usePersonalRegimeStore.getState();
  if (result.ok) store.setRegime(child.id, result.regime);
  store.markRun(child.id, localDayKey(now));
  return result;
}

export async function recalculatePersonalRegime(
  child: Child,
  now = Date.now(),
): Promise<PersonalRegimeResult> {
  await pullRegimeWindow(child, now);
  return buildFromLocalRecords(child, now);
}

export type PersonalRegimeRefresh =
  | PersonalRegimeResult
  | { ok: false; reason: "unavailable" };

export async function refreshPersonalRegime(
  child: Child,
  now = Date.now(),
): Promise<PersonalRegimeRefresh> {
  await pullRegimeWindow(child, now);
  if (!(await isPersonalRegimeAvailable(child, now))) {
    usePersonalRegimeStore.getState().markRun(child.id, localDayKey(now));
    return { ok: false, reason: "unavailable" };
  }
  return buildFromLocalRecords(child, now);
}
