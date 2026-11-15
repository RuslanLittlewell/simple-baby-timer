import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { isPersonalRegime, type PersonalRegime } from '@/lib/personal-regime';
import {
  isRegimeDayProgress,
  regimeDayProgress,
  type DaySleep,
  type RegimeDayProgress,
} from '@/lib/personal-regime-adjustment';

const STORAGE_KEY = 'babytimer.personal-regime.v1';

/** A settling notification handed to the system, kept so it can be taken back. */
export interface ScheduledRegimeReminder {
  at: number;
  id: string;
  /** The language it was written in; a switch rewrites it. */
  language: string;
}

interface PersistedPersonalRegimeState {
  regimes: Record<string, PersonalRegime>;
  /** How each child's current day has gone, which the rest of today's plan follows. */
  dayProgress: Record<string, RegimeDayProgress>;
  /**
   * Local day of each child's last finished rebuild, so the daily run happens
   * once whichever of its triggers fires first.
   */
  lastRunDay: Record<string, string>;
  ghostVisible: boolean;
  /**
   * Whether the schedule has already shown itself on the timeline once. It
   * turns itself on as soon as there is something to show; from then on the
   * toggle belongs to the user.
   */
  ghostAutoShown: boolean;
  settlingReminders: ScheduledRegimeReminder[];
}

interface PersonalRegimeState extends PersistedPersonalRegimeState {
  setRegime: (childId: string, regime: PersonalRegime) => void;
  recordDayProgress: (childId: string, sleeps: DaySleep[], now: number) => void;
  markRun: (childId: string, day: string) => void;
  removeRegime: (childId: string) => void;
  setGhostVisible: (visible: boolean) => void;
  setSettlingReminders: (reminders: ScheduledRegimeReminder[]) => void;
  clear: () => void;
}

const isDayMap = (value: unknown): value is Record<string, string> =>
  !!value && typeof value === 'object';

const sanitizeReminders = (value: unknown): ScheduledRegimeReminder[] =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is ScheduledRegimeReminder =>
          !!entry &&
          typeof entry === 'object' &&
          typeof (entry as ScheduledRegimeReminder).at === 'number' &&
          typeof (entry as ScheduledRegimeReminder).id === 'string' &&
          typeof (entry as ScheduledRegimeReminder).language === 'string',
      )
    : [];

export const usePersonalRegimeStore = create<PersonalRegimeState>()(
  persist(
    (set, get) => ({
      regimes: {},
      dayProgress: {},
      lastRunDay: {},
      ghostVisible: false,
      ghostAutoShown: false,
      settlingReminders: [],
      setRegime: (childId, regime) =>
        set((state) => ({
          regimes: { ...state.regimes, [childId]: regime },
          ...(state.ghostAutoShown ? {} : { ghostVisible: true, ghostAutoShown: true }),
        })),
      recordDayProgress: (childId, sleeps, now) => {
        const state = get();
        if (!state.regimes[childId]) return;
        const progress = regimeDayProgress(sleeps, now);
        const current = state.dayProgress[childId];
        if (JSON.stringify(current) === JSON.stringify(progress)) return;
        set({ dayProgress: { ...state.dayProgress, [childId]: progress } });
      },
      markRun: (childId, day) =>
        set((state) => ({ lastRunDay: { ...state.lastRunDay, [childId]: day } })),
      removeRegime: (childId) =>
        set((state) => {
          const { [childId]: _removed, ...regimes } = state.regimes;
          const { [childId]: _removedRun, ...lastRunDay } = state.lastRunDay;
          const { [childId]: _removedProgress, ...dayProgress } = state.dayProgress;
          return { regimes, lastRunDay, dayProgress };
        }),
      setGhostVisible: (ghostVisible) => set({ ghostVisible, ghostAutoShown: true }),
      setSettlingReminders: (settlingReminders) => set({ settlingReminders }),
      clear: () =>
        set({
          regimes: {},
          dayProgress: {},
          lastRunDay: {},
          ghostVisible: false,
          ghostAutoShown: false,
          settlingReminders: [],
        }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persisted) => persisted as PersistedPersonalRegimeState,
      partialize: ({
        regimes,
        dayProgress,
        lastRunDay,
        ghostVisible,
        ghostAutoShown,
        settlingReminders,
      }): PersistedPersonalRegimeState => ({
        regimes,
        dayProgress,
        lastRunDay,
        ghostVisible,
        ghostAutoShown,
        settlingReminders,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<PersistedPersonalRegimeState>;
        const regimes =
          saved.regimes && typeof saved.regimes === 'object'
            ? Object.fromEntries(
                Object.entries(saved.regimes).filter(
                  (entry): entry is [string, PersonalRegime] => isPersonalRegime(entry[1]),
                ),
              )
            : {};
        const lastRunDay = isDayMap(saved.lastRunDay)
          ? Object.fromEntries(
              Object.entries(saved.lastRunDay).filter(
                (entry): entry is [string, string] => typeof entry[1] === 'string',
              ),
            )
          : {};
        // Day adjustments of earlier versions are dropped: today's progress
        // is read off the sleeps again as soon as the app starts.
        const dayProgress =
          saved.dayProgress && typeof saved.dayProgress === 'object'
            ? Object.fromEntries(
                Object.entries(saved.dayProgress).filter(
                  (entry): entry is [string, RegimeDayProgress] =>
                    isRegimeDayProgress(entry[1]),
                ),
              )
            : {};
        return {
          ...current,
          regimes,
          dayProgress,
          lastRunDay,
          ghostVisible: saved.ghostVisible === true,
          ghostAutoShown: saved.ghostAutoShown === true,
          settlingReminders: sanitizeReminders(saved.settlingReminders),
        };
      },
    },
  ),
);
