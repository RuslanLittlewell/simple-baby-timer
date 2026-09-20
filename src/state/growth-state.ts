import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  addGrowthMeasurementToList,
  editGrowthMeasurementInList,
  mergeGrowthMeasurementLists,
  sanitizeGrowthMeasurements,
  sortGrowthMeasurements,
  type GrowthMeasurement,
  type NewGrowthMeasurementInput,
} from '@/lib/growth-measurements';

const STORAGE_KEY = 'babytimer.growth.v1';

interface SyncedGrowthMeasurement {
  measurement: GrowthMeasurement;
  submittedUpdatedAt: number;
}

interface GrowthState {
  measurements: GrowthMeasurement[];
  pendingIds: string[];
  version: number;
  addMeasurement: (input: NewGrowthMeasurementInput) => GrowthMeasurement;
  updateMeasurement: (
    id: string,
    input: Omit<NewGrowthMeasurementInput, 'childId'>,
  ) => GrowthMeasurement | null;
  mergeRemoteMeasurements: (
    childId: string,
    measurements: GrowthMeasurement[],
  ) => void;
  markMeasurementsSynced: (items: SyncedGrowthMeasurement[]) => void;
  removeChildMeasurements: (childId: string) => void;
  clearMeasurements: () => void;
}

const markPending = (pendingIds: string[], id: string) =>
  pendingIds.includes(id) ? pendingIds : [...pendingIds, id];

export const useGrowthStore = create<GrowthState>()(
  persist(
    (set, get) => ({
      measurements: [],
      pendingIds: [],
      version: 0,
      addMeasurement: (input) => {
        const now = Date.now();
        const result = addGrowthMeasurementToList(get().measurements, input, now);
        set((state) => ({
          measurements: result.measurements,
          pendingIds: markPending(state.pendingIds, result.measurement.id),
          version: state.version + 1,
        }));
        return result.measurement;
      },
      updateMeasurement: (id, input) => {
        const result = editGrowthMeasurementInList(get().measurements, id, input);
        if (!result) return null;
        set((state) => ({
          measurements: result.measurements,
          pendingIds: markPending(state.pendingIds, id),
          version: state.version + 1,
        }));
        return result.measurement;
      },
      mergeRemoteMeasurements: (childId, incoming) =>
        set((state) => {
          const relevant = incoming.filter((item) => item.childId === childId);
          const measurements = mergeGrowthMeasurementLists(
            state.measurements,
            relevant,
            new Set(state.pendingIds),
          );
          if (
            measurements.length === state.measurements.length &&
            measurements.every((item, index) => item === state.measurements[index])
          ) return {};
          return {
            measurements,
            version: state.version + 1,
          };
        }),
      markMeasurementsSynced: (items) =>
        set((state) => {
          const syncedById = new Map(items.map((item) => [item.measurement.id, item]));
          const pendingIds = state.pendingIds.filter((id) => {
            const synced = syncedById.get(id);
            if (!synced) return true;
            const current = state.measurements.find((item) => item.id === id);
            return current?.updatedAt !== synced.submittedUpdatedAt;
          });
          const measurements = state.measurements.map((current) => {
            const synced = syncedById.get(current.id);
            if (!synced || current.updatedAt !== synced.submittedUpdatedAt) return current;
            return synced.measurement;
          });
          return {
            measurements: sortGrowthMeasurements(measurements),
            pendingIds,
            version: state.version + 1,
          };
        }),
      removeChildMeasurements: (childId) =>
        set((state) => {
          const removedIds = new Set(
            state.measurements.filter((item) => item.childId === childId).map((item) => item.id),
          );
          return {
            measurements: state.measurements.filter((item) => item.childId !== childId),
            pendingIds: state.pendingIds.filter((id) => !removedIds.has(id)),
            version: state.version + 1,
          };
        }),
      clearMeasurements: () => set((state) => ({
        measurements: [],
        pendingIds: [],
        version: state.version + 1,
      })),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: ({ measurements, pendingIds }) => ({ measurements, pendingIds }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<GrowthState>;
        const measurements = sanitizeGrowthMeasurements(saved.measurements);
        const knownIds = new Set(measurements.map((item) => item.id));
        return {
          ...current,
          measurements,
          pendingIds: Array.isArray(saved.pendingIds)
            ? saved.pendingIds.filter(
                (id): id is string => typeof id === 'string' && knownIds.has(id),
              )
            : [],
        };
      },
    },
  ),
);
