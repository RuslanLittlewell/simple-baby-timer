import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import { AppState as RNAppState } from 'react-native';
import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';

import {
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  translate,
  type LanguageCode,
  type TranslateParams,
} from '@/i18n';
import { EVENT_DURATION_MS, saveSession, type EventKind } from '@/lib/activity-store';
import { startLiveActivity, stopLiveActivity } from '@/lib/live-activity';
import {
  cancelReminder,
  configureNotificationHandler,
  scheduleActivityNotification,
  type ActivityKind,
} from '@/lib/notifications';

const STORAGE_KEY = 'babytimer.settings.v1';

export const TIMER_MIN = 15;
export const TIMER_MAX = 600;
export const TIMER_STEP = 15;

export const FEEDING_MIN = 5;
export const FEEDING_MAX = 60;
export const FEEDING_STEP = 5;

/** Настройки — единственное, что переживает перезапуск. */
type Settings = {
  sleepMinutes: number;
  awakeMinutes: number;
  feedingMinutes: number;
  language: LanguageCode;
};

const DEFAULT_SETTINGS: Settings = {
  sleepMinutes: 120,
  awakeMinutes: 120,
  feedingMinutes: 20,
  language: DEFAULT_LANGUAGE,
};

const clampTimer = (value: number) =>
  Math.min(TIMER_MAX, Math.max(TIMER_MIN, Math.round(value / TIMER_STEP) * TIMER_STEP));
const clampFeeding = (value: number) =>
  Math.min(FEEDING_MAX, Math.max(FEEDING_MIN, Math.round(value / FEEDING_STEP) * FEEDING_STEP));

/** Значение из хранилища может быть любым — мусор заменяем дефолтом. */
const pickNumber = (value: unknown, clamp: (n: number) => number, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? clamp(value) : fallback;

export type Session = {
  kind: ActivityKind;
  startedAt: number;
  reminderId: string | null;
} | null;

/**
 * Две независимые дорожки. Сон и бодрствование исключают друг друга и живут в
 * `session`, кормление идёт параллельно в `feeding` и основной режим не прерывает.
 */
const trackOf = (kind: ActivityKind): 'session' | 'feeding' =>
  kind === 'feeding' ? 'feeding' : 'session';

type AppStore = Settings & {
  /** Счётчик правок журнала — календарь перечитывает сессии при его изменении. */
  dataVersion: number;
  /** Основной режим: сон или бодрствование. */
  session: Session;
  /** Кормление — идёт поверх основного режима, само по себе. */
  feeding: Session;
  setSleepMinutes: (value: number) => void;
  setAwakeMinutes: (value: number) => void;
  setFeedingMinutes: (value: number) => void;
  setLanguage: (code: LanguageCode) => void;
  startActivity: (kind: ActivityKind) => Promise<void>;
  stopActivity: (kind: ActivityKind) => Promise<void>;
  /** Разовая отметка (какашки, подгузник) — пишется сразу, таймер не заводит. */
  logEvent: (kind: EventKind) => Promise<void>;
};

/**
 * До zustand настройки лежали в том же ключе плоским объектом. Заворачиваем их
 * в формат persist как версию 0, чтобы у существующих пользователей ничего не сбросилось.
 */
const storage: PersistStorage<Settings> = {
  getItem: async (name) => {
    const raw = await AsyncStorage.getItem(name);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return 'state' in parsed ? parsed : { state: parsed, version: 0 };
    } catch {
      return null;
    }
  },
  setItem: (name, value) => AsyncStorage.setItem(name, JSON.stringify(value)),
  removeItem: (name) => AsyncStorage.removeItem(name),
};

/** Ещё более старый формат хранил часы, а не минуты. */
type LegacySettings = Partial<Settings> & { sleepHours?: number; awakeHours?: number };

let autoStopTimer: ReturnType<typeof setTimeout> | null = null;
const clearAutoStop = () => {
  if (autoStopTimer) {
    clearTimeout(autoStopTimer);
    autoStopTimer = null;
  }
};

/** Пишет завершённую сессию в журнал. Слишком короткие (<1с) отбрасываем. */
async function finalizeSession(current: NonNullable<Session>, feedingMinutes: number) {
  let end = Date.now();
  if (current.kind === 'feeding') {
    // Кормление не может «висеть» дольше лимита, даже если приложение было в фоне.
    const limitEnd = current.startedAt + feedingMinutes * 60_000;
    if (end > limitEnd) end = limitEnd;
  }
  if (end - current.startedAt < 1000) return;
  await saveSession({
    id: `${current.startedAt}-${current.kind}`,
    kind: current.kind,
    start: current.startedAt,
    end,
  });
  useAppStore.setState((state) => ({ dataVersion: state.dataVersion + 1 }));
}

/** Подписи для Live Activity: название активности и время её старта. */
const pad2 = (n: number) => String(n).padStart(2, '0');
function liveActivityLabels(language: LanguageCode, kind: ActivityKind, startedAt: number) {
  const at = new Date(startedAt);
  return {
    title: translate(language, `kind.${kind}`),
    subtitle: translate(language, 'live.startedAt', {
      time: `${pad2(at.getHours())}:${pad2(at.getMinutes())}`,
    }),
  };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      dataVersion: 0,
      session: null,
      feeding: null,

      setSleepMinutes: (value) => set({ sleepMinutes: clampTimer(value) }),
      setAwakeMinutes: (value) => set({ awakeMinutes: clampTimer(value) }),
      setFeedingMinutes: (value) => set({ feedingMinutes: clampFeeding(value) }),
      setLanguage: (code) => set({ language: normalizeLanguage(code) }),

      startActivity: async (kind) => {
        const track = trackOf(kind);
        const { sleepMinutes, awakeMinutes, feedingMinutes, language } = get();

        // Завершаем только свою дорожку: кормление не трогает сон/бодрствование,
        // а смена сна на бодрствование не сбивает идущее кормление.
        const prev = get()[track];
        if (prev) {
          if (track === 'feeding') clearAutoStop();
          await cancelReminder(prev.reminderId);
          await finalizeSession(prev, feedingMinutes);
        }

        const startedAt = Date.now();
        // Один лимит на всё: и уведомление, и отсчёт в островке — чтобы не разъезжались.
        const limitMinutes =
          kind === 'sleep' ? sleepMinutes : kind === 'awake' ? awakeMinutes : feedingMinutes;

        // Островок заводим сразу, не дожидаясь запроса разрешений на уведомления.
        startLiveActivity(
          track,
          kind,
          startedAt + limitMinutes * 60_000,
          liveActivityLabels(language, kind, startedAt),
        );

        const reminderId = await scheduleActivityNotification(
          {
            title: translate(language, `notif.${kind}.title`),
            body: translate(language, `notif.${kind}.body`),
          },
          limitMinutes * 60,
        );

        if (track === 'feeding') {
          // Кормление останавливает себя само по истечении лимита.
          autoStopTimer = setTimeout(() => {
            const current = get().feeding;
            if (current?.startedAt !== startedAt) return;
            stopLiveActivity('feeding');
            finalizeSession(current, get().feedingMinutes).then(() => set({ feeding: null }));
          }, limitMinutes * 60_000);
        }

        const started = { kind, startedAt, reminderId };
        set(track === 'feeding' ? { feeding: started } : { session: started });
      },

      stopActivity: async (kind) => {
        const track = trackOf(kind);
        const current = get()[track];
        if (!current) return;
        if (track === 'feeding') clearAutoStop();
        stopLiveActivity(track);
        await cancelReminder(current.reminderId);
        await finalizeSession(current, get().feedingMinutes);
        set(track === 'feeding' ? { feeding: null } : { session: null });
      },

      logEvent: async (kind) => {
        // Момент нажатия и есть событие; на шкале растягиваем на фиксированные 5 минут,
        // иначе блок нулевой длины было бы не разглядеть и не нажать.
        const start = Date.now();
        await saveSession({
          id: `${start}-${kind}`,
          kind,
          start,
          end: start + EVENT_DURATION_MS,
        });
        set((state) => ({ dataVersion: state.dataVersion + 1 }));
      },
    }),
    {
      name: STORAGE_KEY,
      storage,
      version: 1,
      // Сессия живёт только в памяти — на диск идут одни настройки.
      partialize: ({ sleepMinutes, awakeMinutes, feedingMinutes, language }) => ({
        sleepMinutes,
        awakeMinutes,
        feedingMinutes,
        language,
      }),
      migrate: (persisted, version) => {
        const legacy = (persisted ?? {}) as LegacySettings;
        if (version > 0) return legacy as Settings;
        return {
          ...DEFAULT_SETTINGS,
          ...legacy,
          sleepMinutes: legacy.sleepMinutes ?? (legacy.sleepHours ?? NaN) * 60,
          awakeMinutes: legacy.awakeMinutes ?? (legacy.awakeHours ?? NaN) * 60,
        } as Settings;
      },
      // Единственное место, где приземляются значения с диска, — здесь и чистим.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<Settings>;
        return {
          ...current,
          sleepMinutes: pickNumber(saved.sleepMinutes, clampTimer, current.sleepMinutes),
          awakeMinutes: pickNumber(saved.awakeMinutes, clampTimer, current.awakeMinutes),
          feedingMinutes: pickNumber(saved.feedingMinutes, clampFeeding, current.feedingMinutes),
          language: normalizeLanguage(saved.language),
        };
      },
    },
  ),
);

/**
 * Перевод, привязанный к текущему языку. Отдельным хуком, а не полем стора:
 * так подписка идёт только на `language`, и `t` меняет ссылку только вместе с ним.
 */
export function useT() {
  const language = useAppStore((state) => state.language);
  return useCallback(
    (key: string, params?: TranslateParams) => translate(language, key, params),
    [language],
  );
}

configureNotificationHandler();

// Возврат в приложение: если кормление уже превысило лимит в фоне — завершаем.
// Fast Refresh переисполняет модуль, поэтому старую подписку снимаем через globalThis:
// без этого в дев-режиме накапливаются дубли и сессия сохраняется по нескольку раз.
const globalScope = globalThis as typeof globalThis & {
  __babytimerAppStateSub?: { remove: () => void };
};
globalScope.__babytimerAppStateSub?.remove();
globalScope.__babytimerAppStateSub = RNAppState.addEventListener('change', (state) => {
  if (state !== 'active') return;
  const { feeding, feedingMinutes } = useAppStore.getState();
  if (!feeding) return;
  if (Date.now() - feeding.startedAt < feedingMinutes * 60_000) return;
  clearAutoStop();
  stopLiveActivity('feeding');
  finalizeSession(feeding, feedingMinutes).then(() => useAppStore.setState({ feeding: null }));
});
