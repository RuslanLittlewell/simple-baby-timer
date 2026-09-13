import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { isPersonalRegime, type PersonalRegime } from '@/lib/personal-regime';

const STORAGE_KEY = 'babytimer.personal-regime.v1';

interface PersistedPersonalRegimeState {
  regimes: Record<string, PersonalRegime>;
  ghostVisible: boolean;
}

interface PersonalRegimeState extends PersistedPersonalRegimeState {
  setRegime: (childId: string, regime: PersonalRegime) => void;
  removeRegime: (childId: string) => void;
  setGhostVisible: (visible: boolean) => void;
  clear: () => void;
}

export const usePersonalRegimeStore = create<PersonalRegimeState>()(
  persist(
    (set) => ({
      regimes: {},
      ghostVisible: false,
      setRegime: (childId, regime) =>
        set((state) => ({ regimes: { ...state.regimes, [childId]: regime } })),
      removeRegime: (childId) =>
        set((state) => {
          const { [childId]: _removed, ...regimes } = state.regimes;
          return { regimes };
        }),
      setGhostVisible: (ghostVisible) => set({ ghostVisible }),
      clear: () => set({ regimes: {}, ghostVisible: false }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: ({ regimes, ghostVisible }): PersistedPersonalRegimeState => ({
        regimes,
        ghostVisible,
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
        return { ...current, regimes, ghostVisible: saved.ghostVisible === true };
      },
    },
  ),
);
