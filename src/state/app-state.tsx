import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState as RNAppState } from 'react-native';

import {
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  translate,
  type LanguageCode,
  type TranslateParams,
} from '@/i18n';
import { saveSession, type ActivitySession } from '@/lib/activity-store';
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

type Session = {
  kind: ActivityKind;
  startedAt: number;
  reminderId: string | null;
} | null;

type AppState = {
  ready: boolean;

  dataVersion: number;
  sleepMinutes: number;
  awakeMinutes: number;
  feedingMinutes: number;
  setSleepMinutes: (value: number) => void;
  setAwakeMinutes: (value: number) => void;
  setFeedingMinutes: (value: number) => void;
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: string, params?: TranslateParams) => string;
  session: Session;
  startActivity: (kind: ActivityKind) => Promise<void>;
  stopActivity: () => Promise<void>;
};

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [session, setSession] = useState<Session>(null);
  const [dataVersion, setDataVersion] = useState(0);

  const sessionRef = useRef<Session>(null);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);
  const feedingMinutesRef = useRef(settings.feedingMinutes);
  useEffect(() => {
    feedingMinutesRef.current = settings.feedingMinutes;
  }, [settings.feedingMinutes]);

  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearAutoStop = useCallback(() => {
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
  }, []);

  useEffect(() => {
    configureNotificationHandler();
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Settings> & {
            sleepHours?: number;
            awakeHours?: number;
          };
          setSettings({
            sleepMinutes: clampTimer(
              parsed.sleepMinutes ??
                (parsed.sleepHours != null ? parsed.sleepHours * 60 : DEFAULT_SETTINGS.sleepMinutes),
            ),
            awakeMinutes: clampTimer(
              parsed.awakeMinutes ??
                (parsed.awakeHours != null ? parsed.awakeHours * 60 : DEFAULT_SETTINGS.awakeMinutes),
            ),
            feedingMinutes: clampFeeding(parsed.feedingMinutes ?? DEFAULT_SETTINGS.feedingMinutes),
            language: normalizeLanguage(parsed.language),
          });
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings, ready]);

  const setSleepMinutes = useCallback(
    (value: number) => setSettings((prev) => ({ ...prev, sleepMinutes: clampTimer(value) })),
    [],
  );
  const setAwakeMinutes = useCallback(
    (value: number) => setSettings((prev) => ({ ...prev, awakeMinutes: clampTimer(value) })),
    [],
  );
  const setFeedingMinutes = useCallback(
    (value: number) => setSettings((prev) => ({ ...prev, feedingMinutes: clampFeeding(value) })),
    [],
  );
  const setLanguage = useCallback(
    (code: LanguageCode) => setSettings((prev) => ({ ...prev, language: normalizeLanguage(code) })),
    [],
  );
  const t = useCallback(
    (key: string, params?: TranslateParams) => translate(settings.language, key, params),
    [settings.language],
  );

  const finalizeSession = useCallback(async (current: Session) => {
    if (!current) return;
    let end = Date.now();
    if (current.kind === 'feeding') {
      const limitEnd = current.startedAt + feedingMinutesRef.current * 60_000;
      if (end > limitEnd) end = limitEnd;
    }
    if (end - current.startedAt < 1000) return;
    const record: ActivitySession = {
      id: `${current.startedAt}-${current.kind}`,
      kind: current.kind,
      start: current.startedAt,
      end,
    };
    await saveSession(record);
    setDataVersion((v) => v + 1);
  }, []);

  const startActivity = useCallback(
    async (kind: ActivityKind) => {
      clearAutoStop();
      // Переключение на другую активность завершает текущую.
      const prev = sessionRef.current;
      if (prev) {
        await cancelReminder(prev.reminderId);
        await finalizeSession(prev);
      }

      const startedAt = Date.now();
      let reminderId: string | null = null;

      if (kind === 'sleep') {
        reminderId = await scheduleActivityNotification(
          {
            title: translate(settings.language, 'notif.sleep.title'),
            body: translate(settings.language, 'notif.sleep.body'),
          },
          settings.sleepMinutes * 60,
        );
      } else if (kind === 'awake') {
        reminderId = await scheduleActivityNotification(
          {
            title: translate(settings.language, 'notif.awake.title'),
            body: translate(settings.language, 'notif.awake.body'),
          },
          settings.awakeMinutes * 60,
        );
      } else if (kind === 'feeding') {
        // Кормление: уведомление + авто-остановка таймера по истечении лимита.
        reminderId = await scheduleActivityNotification(
          {
            title: translate(settings.language, 'notif.feeding.title'),
            body: translate(settings.language, 'notif.feeding.body'),
          },
          settings.feedingMinutes * 60,
        );
        autoStopRef.current = setTimeout(
          () => {
            const cur = sessionRef.current;
            if (cur && cur.kind === 'feeding' && cur.startedAt === startedAt) {
              finalizeSession(cur).then(() => setSession(null));
            }
          },
          settings.feedingMinutes * 60_000,
        );
      }

      setSession({ kind, startedAt, reminderId });
    },
    [clearAutoStop, finalizeSession, settings],
  );

  const stopActivity = useCallback(async () => {
    clearAutoStop();
    const cur = sessionRef.current;
    if (!cur) return;
    await cancelReminder(cur.reminderId);
    await finalizeSession(cur);
    setSession(null);
  }, [clearAutoStop, finalizeSession]);

  // Возврат в приложение: если кормление уже превысило лимит в фоне — завершаем.
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const cur = sessionRef.current;
      if (cur?.kind !== 'feeding') return;
      const limitMs = feedingMinutesRef.current * 60_000;
      if (Date.now() - cur.startedAt >= limitMs) {
        clearAutoStop();
        finalizeSession(cur).then(() => setSession(null));
      }
    });
    return () => sub.remove();
  }, [clearAutoStop, finalizeSession]);

  return (
    <AppStateContext.Provider
      value={{
        ready,
        dataVersion,
        sleepMinutes: settings.sleepMinutes,
        awakeMinutes: settings.awakeMinutes,
        feedingMinutes: settings.feedingMinutes,
        setSleepMinutes,
        setAwakeMinutes,
        setFeedingMinutes,
        language: settings.language,
        setLanguage,
        t,
        session,
        startActivity,
        stopActivity,
      }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
