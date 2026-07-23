import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACTIVITY_ACCENT, ACTIVITY_FG, ACTIVITY_GRADIENTS } from '@/constants/activities';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MONTHS_I18N, WEEKDAYS_I18N, type TranslateParams } from '@/i18n';
import {
  EVENT_DURATION_MS,
  deleteSession,
  getSessionsForDay,
  updateSession,
  type ActivitySession,
  type SessionKind,
} from '@/lib/activity-store';
import { type ActivityKind } from '@/lib/notifications';
import { useAppStore, useT } from '@/state/app-state';

const GUTTER = 52;
const NOW_COLOR = '#FF3B30';
const DANGER_COLOR = '#FF6B6B';

const ZOOM_MODES = [
  { step: 60, hourHeight: 40 },
  { step: 30, hourHeight: 60 },
  { step: 15, hourHeight: 96 },
  { step: 10, hourHeight: 144 },
  { step: 5, hourHeight: 264 },
];
const DEFAULT_ZOOM = 2;
const ZOOM_STEP_RATIO = 1.45;
const ZOOM_BADGE_HOLD = 700;

const SCROLL_BOTTOM_PAD = Spacing.six;

const LANES: Record<SessionKind, number> = {
  sleep: 0,
  awake: 0,
  feeding: 1,
  poop: 2,
  diaper: 3,
};
const LANE_INSET = 40;
const laneLeft = (kind: SessionKind) => GUTTER + LANES[kind] * LANE_INSET;

const isEvent = (kind: SessionKind) => kind === 'poop' || kind === 'diaper';
const MIN_EVENT_HEIGHT = 10;

const STRIPE_PITCH = 12;
const STRIPE_THICKNESS = 6;
const STRIPE_SKEW = '-45deg';
const SCREEN_WIDTH = Dimensions.get('window').width;

type KindMeta = {
  gradKey: keyof typeof ACTIVITY_GRADIENTS;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const KIND_META: Record<SessionKind, KindMeta> = {
  sleep: { gradKey: 'sleep', icon: 'moon-waning-crescent' },
  feeding: { gradKey: 'feed', icon: 'baby-bottle-outline' },
  awake: { gradKey: 'awake', icon: 'white-balance-sunny' },
  poop: { gradKey: 'poop', icon: 'emoticon-poop' },
  diaper: { gradKey: 'diaper', icon: 'diaper-outline' },
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const fmtTime = (ts: number) => {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatDuration = (milliseconds: number, hoursUnit: string, minutesUnit: string) => {
  const totalMinutes = Math.max(0, Math.round(milliseconds / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} ${minutesUnit}`;
  if (!minutes) return `${hours} ${hoursUnit}`;
  return `${hours} ${hoursUnit} ${minutes} ${minutesUnit}`;
};

const normalizeTimeInput = (value: string) => {
  const digits = value.replace(/[^0-9]/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
};

const parseTime = (value: string) => {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
};

type Translate = (key: string, params?: TranslateParams) => string;

const TimelineGrid = memo(function TimelineGrid({
  hourHeight,
  step,
  hourLineColor,
  minorLineColor,
}: {
  hourHeight: number;
  step: number;
  hourLineColor: string;
  minorLineColor: string;
}) {
  const marks: { top: number; label: string }[] = [];
  if (step < 60) {
    for (let h = 0; h < 24; h++) {
      for (let m = step; m < 60; m += step) {
        marks.push({ top: ((h * 60 + m) / 60) * hourHeight, label: pad2(m) });
      }
    }
  }

  return (
    <>
      {Array.from({ length: 25 }).map((_, h) => (
        <View
          key={`hl-${h}`}
          pointerEvents="none"
          style={[styles.hourLine, { top: h * hourHeight, backgroundColor: hourLineColor }]}
        />
      ))}
      {Array.from({ length: 24 }).map((_, h) => (
        <View
          key={`ha-${h}`}
          pointerEvents="none"
          style={[styles.hourLabel, { top: h * hourHeight - 8 }]}>
          <ThemedText style={styles.hourNum}>{pad2(h)}</ThemedText>
          <ThemedText style={styles.hourSup} themeColor="textSecondary">
            00
          </ThemedText>
        </View>
      ))}
      {marks.map((mk) => (
        <View key={`m-${mk.top}`} pointerEvents="none">
          <View style={[styles.minorLine, { top: mk.top, backgroundColor: minorLineColor }]} />
          <ThemedText
            style={[styles.minorLabel, { top: mk.top - 8 }]}
            themeColor="textSecondary">
            {mk.label}
          </ThemedText>
        </View>
      ))}
    </>
  );
});

const TimelineBlocks = memo(function TimelineBlocks({
  sessions,
  hourHeight,
  dayStartMs,
  onEdit,
  t,
}: {
  sessions: ActivitySession[];
  hourHeight: number;
  dayStartMs: number;
  onEdit: (entry: ActivitySession) => void;
  t: Translate;
}) {
  const px = (minutes: number) => (minutes / 60) * hourHeight;
  const ordered = [...sessions].sort((a, b) => LANES[a.kind] - LANES[b.kind]);

  return (
    <>
      {ordered.map((s) => {
        const startMin = (s.start - dayStartMs) / 60000;
        const endMin = (s.end - dayStartMs) / 60000;
        const clampedStart = Math.max(0, Math.min(24 * 60, startMin));
        const clampedEnd = Math.max(0, Math.min(24 * 60, endMin));
        if (clampedEnd <= clampedStart) return null;
        const visibleStart = dayStartMs + clampedStart * 60000;
        const visibleEnd = dayStartMs + clampedEnd * 60000;

        const top = px(clampedStart);
        const spanHeight = px(clampedEnd) - top;
        const meta = KIND_META[s.kind];
        const fg = ACTIVITY_FG[meta.gradKey];

        if (isEvent(s.kind)) {
          const eventHeight = Math.max(spanHeight, MIN_EVENT_HEIGHT);
          const stripeColor = ACTIVITY_GRADIENTS[meta.gradKey][0];
          const blockWidth = SCREEN_WIDTH - laneLeft(s.kind) - Spacing.two;
          const stripes = Math.ceil((blockWidth + 2 * eventHeight) / STRIPE_PITCH);

          return (
            <Pressable
              key={s.id}
              accessibilityLabel={t('editor.editLabel', { label: t(`kind.${s.kind}`) })}
              onPress={() => onEdit(s)}
              style={({ pressed }) => [
                styles.eventBlock,
                { top, height: eventHeight, left: laneLeft(s.kind) },
                pressed && styles.pressed,
              ]}>
              <View style={styles.eventStripes} pointerEvents="none">
                {Array.from({ length: stripes }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.eventStripe,
                      { left: i * STRIPE_PITCH - eventHeight, backgroundColor: stripeColor },
                    ]}
                  />
                ))}
              </View>
              <MaterialCommunityIcons name={meta.icon} size={17} color={stripeColor} />
            </Pressable>
          );
        }

        const height = spanHeight;
        const showText = height >= 16;
        const showTime = height >= 34;

        return (
          <Pressable
            key={s.id}
            accessibilityLabel={t('editor.editLabel', { label: t(`kind.${s.kind}`) })}
            onPress={() => onEdit(s)}
            style={({ pressed }) => [
              styles.block,
              { top, height, left: laneLeft(s.kind) },
              pressed && styles.pressed,
            ]}>
            <LinearGradient
              colors={ACTIVITY_GRADIENTS[meta.gradKey]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.blockGradient}>
              {showText && (
                <View style={styles.blockContent}>
                  <View style={styles.blockRow}>
                    <MaterialCommunityIcons name={meta.icon} size={14} color={fg} />
                    <ThemedText style={[styles.blockTitle, { color: fg }]} numberOfLines={1}>
                      {t(`kind.${s.kind}`)}
                      {s.kind === 'feeding' && s.milkMl ? ` · ${s.milkMl} ${t('unit.ml')}` : ''}
                    </ThemedText>
                  </View>
                  {showTime && (
                    <ThemedText style={[styles.blockTime, { color: fg }]} numberOfLines={1}>
                      {fmtTime(visibleStart)}–{fmtTime(visibleEnd)}
                    </ThemedText>
                  )}
                </View>
              )}
            </LinearGradient>
          </Pressable>
        );
      })}
    </>
  );
});

const ZoomBadge = memo(function ZoomBadge({ label, zoom }: { label: string; zoom: number }) {
  const opacity = useSharedValue(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    opacity.value = withSequence(
      withTiming(1, { duration: 110 }),
      withDelay(ZOOM_BADGE_HOLD, withTiming(0, { duration: 260 })),
    );
  }, [zoom, opacity]);

  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View pointerEvents="none" style={[styles.zoomBadgeWrap, fade]}>
      <View style={styles.zoomBadge}>
        <ThemedText style={styles.zoomBadgeText}>{label}</ThemedText>
      </View>
    </Animated.View>
  );
});

function buildMonthCells(year: number, month: number): (number | null)[] {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstWeekday).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarScreen() {
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const didAutoScroll = useRef(false);

  const [today, setToday] = useState(() => new Date());
  const todayRef = useRef(today);
  const [view, setView] = useState<'day' | 'month'>('day');
  const [shownDay, setShownDay] = useState<Date>(today);
  const [monthCursor, setMonthCursor] = useState<Date>(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const dataVersion = useAppStore((state) => state.dataVersion);
  const session = useAppStore((state) => state.session);
  const feeding = useAppStore((state) => state.feeding);
  const language = useAppStore((state) => state.language);
  const t = useT();
  const WEEKDAYS = WEEKDAYS_I18N[language];
  const MONTHS = MONTHS_I18N[language];
  const [sessions, setSessions] = useState<ActivitySession[]>([]);
  const [statsVisible, setStatsVisible] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<ActivitySession | null>(null);
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');
  const [milkInput, setMilkInput] = useState('');
  const [editorError, setEditorError] = useState('');

  const syncCurrentDate = useCallback(() => {
    const nextToday = new Date();
    const previousToday = todayRef.current;
    if (!isSameDay(previousToday, nextToday)) {
      todayRef.current = nextToday;
      setToday(nextToday);
      setShownDay((current) => {
        if (!isSameDay(current, previousToday)) return current;
        didAutoScroll.current = false;
        return nextToday;
      });
      setMonthCursor((current) =>
        current.getFullYear() === previousToday.getFullYear() &&
        current.getMonth() === previousToday.getMonth()
          ? new Date(nextToday.getFullYear(), nextToday.getMonth(), 1)
          : current,
      );
    }
    setNow(nextToday.getTime());
  }, []);

  useEffect(() => {
    let alive = true;
    getSessionsForDay(shownDay).then((list) => {
      if (alive) setSessions(list);
    });
    return () => {
      alive = false;
    };
  }, [shownDay, dataVersion]);

  const openEntryEditor = useCallback((entry: ActivitySession) => {
    setEntryToEdit(entry);
    setStartInput(fmtTime(entry.start));
    setEndInput(fmtTime(entry.end));
    setMilkInput(entry.milkMl ? String(entry.milkMl) : '');
    setEditorError('');
  }, []);

  const closeEntryEditor = () => {
    setEntryToEdit(null);
    setStartInput('');
    setEndInput('');
    setMilkInput('');
    setEditorError('');
  };

  const deleteEntry = () => {
    if (!entryToEdit) return;
    const entry = entryToEdit;
    Alert.alert(t('editor.deleteConfirm'), undefined, [
      { text: t('editor.cancel'), style: 'cancel' },
      {
        text: t('editor.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteSession(entry.id, new Date(entry.start));
          setSessions((current) => current.filter((item) => item.id !== entry.id));
          closeEntryEditor();
        },
      },
    ]);
  };

  const saveEntry = async () => {
    if (!entryToEdit) return;
    const fixedDuration = isEvent(entryToEdit.kind);
    const startTime = parseTime(startInput);
    const endTime = fixedDuration ? startTime : parseTime(endInput);
    if (!startTime || !endTime) {
      setEditorError(t('editor.errTimeFormat'));
      return;
    }

    const originalDate = new Date(entryToEdit.start);
    const start = new Date(
      originalDate.getFullYear(), originalDate.getMonth(), originalDate.getDate(),
      startTime.hours, startTime.minutes,
    ).getTime();
    let end = fixedDuration
      ? start + EVENT_DURATION_MS
      : new Date(
          originalDate.getFullYear(), originalDate.getMonth(), originalDate.getDate(),
          endTime.hours, endTime.minutes,
        ).getTime();
    if (!fixedDuration && end < start) {
      end = new Date(
        originalDate.getFullYear(), originalDate.getMonth(), originalDate.getDate() + 1,
        endTime.hours, endTime.minutes,
      ).getTime();
    }
    if (end <= start) {
      setEditorError(t('editor.errEndAfterStart'));
      return;
    }

    const parsedMilk = Number.parseInt(milkInput, 10);
    if (entryToEdit.kind === 'feeding' && milkInput && (parsedMilk <= 0 || parsedMilk > 5000)) {
      setEditorError(t('editor.errMilkRange'));
      return;
    }
    const milkMl = entryToEdit.kind === 'feeding' && milkInput ? parsedMilk : undefined;
    const updated = { ...entryToEdit, start, end, milkMl };
    await updateSession(entryToEdit.id, originalDate, { start, end, milkMl });
    setSessions((current) =>
      current.map((item) => (item.id === entryToEdit.id ? updated : item)).sort((a, b) => a.start - b.start),
    );
    closeEntryEditor();
  };

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    syncCurrentDate();
    const id = view === 'day' ? setInterval(syncCurrentDate, 1000) : undefined;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncCurrentDate();
    });
    return () => {
      if (id) clearInterval(id);
      subscription.remove();
    };
  }, [syncCurrentDate, view]);

  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const { step: gridStep, hourHeight } = ZOOM_MODES[zoom];
  const zoomRef = useRef(zoom);

  const [pinching, setPinching] = useState(false);
  const scrollY = useRef(0);
  const viewportHeight = useRef(0);
  const pendingScrollY = useRef<number | null>(null);
  const pinchAnchor = useRef({ hour: 0, screenY: 0 });
  const pinchRefScale = useRef(1);

  const beginPinch = useCallback((focalY: number) => {
    const base = ZOOM_MODES[zoomRef.current].hourHeight;
    pinchAnchor.current = { hour: (scrollY.current + focalY) / base, screenY: focalY };
    pinchRefScale.current = 1;
    setPinching(true);
  }, []);

  const applyPinch = useCallback((scale: number) => {
    const ratio = scale / pinchRefScale.current;
    const crossed = ratio >= ZOOM_STEP_RATIO || ratio <= 1 / ZOOM_STEP_RATIO;
    if (!crossed) return;

    const current = zoomRef.current;
    const next = Math.min(
      ZOOM_MODES.length - 1,
      Math.max(0, current + (ratio >= ZOOM_STEP_RATIO ? 1 : -1)),
    );
    pinchRefScale.current = scale;
    if (next === current) return;
    zoomRef.current = next;

    const height = ZOOM_MODES[next].hourHeight;
    const { hour, screenY } = pinchAnchor.current;
    const maxScroll = Math.max(0, 24 * height + SCROLL_BOTTOM_PAD - viewportHeight.current);
    const target = Math.min(maxScroll, Math.max(0, hour * height - screenY));
    pendingScrollY.current = target;
    setZoom(next);
    scrollRef.current?.scrollTo({ y: target, animated: false });
  }, []);

  const endPinch = useCallback(() => setPinching(false), []);

  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .onStart((e) => {
          'worklet';
          runOnJS(beginPinch)(e.focalY);
        })
        .onUpdate((e) => {
          'worklet';
          runOnJS(applyPinch)(e.scale);
        })
        .onFinalize(() => {
          'worklet';
          runOnJS(endPinch)();
        }),
    [beginPinch, applyPinch, endPinch],
  );

  const openMonth = () => {
    setMonthCursor(new Date(shownDay.getFullYear(), shownDay.getMonth(), 1));
    setView('month');
  };
  const shiftMonth = (delta: number) =>
    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  const pickDay = (day: number) => {
    setShownDay(new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day));
    didAutoScroll.current = false;
    setView('day');
  };

  if (view === 'month') {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const cells = buildMonthCells(year, month);
    const selectedInMonth = shownDay.getFullYear() === year && shownDay.getMonth() === month;

    return (
      <ThemedView style={styles.container}>
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.monthSafe}>
          <View style={styles.monthTop}>
            <ThemedText type="subtitle">{t('calendar.title')}</ThemedText>
            <Pressable
              onPress={() => setView('day')}
              hitSlop={12}
              style={({ pressed }) => pressed && styles.pressed}>
              <MaterialCommunityIcons name="close" size={26} color={theme.text} />
            </Pressable>
          </View>

          <ThemedView type="backgroundElement" style={styles.monthCard}>
            <View style={styles.monthNav}>
              <Pressable
                onPress={() => shiftMonth(-1)}
                hitSlop={12}
                style={({ pressed }) => pressed && styles.pressed}>
                <MaterialCommunityIcons name="chevron-left" size={28} color={theme.text} />
              </Pressable>
              <ThemedText type="smallBold">
                {MONTHS[month]} {year}
              </ThemedText>
              <Pressable
                onPress={() => shiftMonth(1)}
                hitSlop={12}
                style={({ pressed }) => pressed && styles.pressed}>
                <MaterialCommunityIcons name="chevron-right" size={28} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((weekday) => (
                <View key={weekday} style={styles.cell}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {weekday}
                  </ThemedText>
                </View>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {cells.map((day, index) => {
                if (day === null) return <View key={`e-${index}`} style={styles.cell} />;
                const isToday =
                  today.getFullYear() === year &&
                  today.getMonth() === month &&
                  today.getDate() === day;
                const isSelected = selectedInMonth && shownDay.getDate() === day;
                return (
                  <Pressable key={day} style={styles.cell} onPress={() => pickDay(day)}>
                    <ThemedView
                      type={isSelected ? 'backgroundSelected' : undefined}
                      style={styles.dayCircle}>
                      <ThemedText type={isToday ? 'smallBold' : 'small'}>{day}</ThemedText>
                      {isToday && <View style={styles.todayDot} />}
                    </ThemedView>
                  </Pressable>
                );
              })}
            </View>
          </ThemedView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const isToday = isSameDay(shownDay, today);
  const dayStartMs = new Date(
    shownDay.getFullYear(),
    shownDay.getMonth(),
    shownDay.getDate(),
  ).getTime();
  const dayEndMs = new Date(
    shownDay.getFullYear(),
    shownDay.getMonth(),
    shownDay.getDate() + 1,
  ).getTime();
  const nowMinutes = (now - dayStartMs) / 60000;
  const totalHeight = 24 * hourHeight;
  const px = (minutes: number) => (minutes / 60) * hourHeight;

  const clampDayMin = (m: number) => Math.max(0, Math.min(24 * 60, m));
  const liveBlocks: { kind: ActivityKind; start: number; top: number; height: number }[] = [];
  for (const item of [session, feeding]) {
    if (!item || item.startedAt >= dayEndMs || now <= dayStartMs) continue;
    const startMin = clampDayMin((item.startedAt - dayStartMs) / 60000);
    const endMin = clampDayMin(nowMinutes);
    if (endMin <= startMin) continue;
    liveBlocks.push({
      kind: item.kind,
      start: item.startedAt,
      top: px(startMin),
      height: px(endMin) - px(startMin),
    });
  }

  const durationInShownDay = (start: number, end: number) =>
    Math.max(0, Math.min(end, dayEndMs) - Math.max(start, dayStartMs));
  const completedSleepMs = sessions
    .filter((item) => item.kind === 'sleep')
    .reduce((sum, item) => sum + durationInShownDay(item.start, item.end), 0);
  const completedAwakeMs = sessions
    .filter((item) => item.kind === 'awake')
    .reduce((sum, item) => sum + durationInShownDay(item.start, item.end), 0);
  const liveMainMs = session ? durationInShownDay(session.startedAt, now) : 0;
  const sleepMs = completedSleepMs + (session?.kind === 'sleep' ? liveMainMs : 0);
  const awakeMs = completedAwakeMs + (session?.kind === 'awake' ? liveMainMs : 0);
  const milkMl = sessions
    .filter((item) => item.kind === 'feeding' && item.start >= dayStartMs && item.start < dayEndMs)
    .reduce((sum, item) => sum + (item.milkMl ?? 0), 0);
  const poopCount = sessions.filter(
    (item) => item.kind === 'poop' && item.start >= dayStartMs && item.start < dayEndMs,
  ).length;
  const diaperCount = sessions.filter(
    (item) => item.kind === 'diaper' && item.start >= dayStartMs && item.start < dayEndMs,
  ).length;

  const zoomLabel =
    gridStep === 60 ? `1 ${t('unit.hours')}` : `${gridStep} ${t('unit.minutes')}`;
  const editingEvent = entryToEdit ? isEvent(entryToEdit.kind) : false;

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemedView style={styles.container}>
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
          <View style={styles.header}>
            <Pressable
              onPress={openMonth}
              hitSlop={12}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="chevron-left" size={32} color={theme.text} />
            </Pressable>
            <View style={styles.dateBlock}>
              <ThemedText style={styles.dateDay}>{pad2(shownDay.getDate())}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {pad2(shownDay.getMonth() + 1)}.{shownDay.getFullYear()}
              </ThemedText>
            </View>
            <Pressable
              accessibilityLabel={t('calendar.stats')}
              onPress={() => setStatsVisible(true)}
              hitSlop={12}
              style={({ pressed }) => [styles.statsBtn, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="chart-box-outline" size={26} color={theme.text} />
            </Pressable>
          </View>

          <GestureDetector gesture={pinch}>
            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              scrollEnabled={!pinching}
              scrollEventThrottle={16}
              onScroll={(e) => {
                scrollY.current = e.nativeEvent.contentOffset.y;
              }}
              onLayout={(e) => {
                viewportHeight.current = e.nativeEvent.layout.height;
              }}
              onContentSizeChange={() => {
                if (!didAutoScroll.current) {
                  didAutoScroll.current = true;
                  const targetY = isToday ? px(nowMinutes) - 140 : px(6 * 60) - 20;
                  scrollRef.current?.scrollTo({ y: Math.max(0, targetY), animated: false });
                  return;
                }
                const pending = pendingScrollY.current;
                if (pending == null) return;
                pendingScrollY.current = null;
                scrollRef.current?.scrollTo({ y: pending, animated: false });
              }}>
              <View style={[styles.timeline, { height: totalHeight }]}>
                <TimelineGrid
                  hourHeight={hourHeight}
                  step={gridStep}
                  hourLineColor={theme.backgroundSelected}
                  minorLineColor={theme.backgroundElement}
                />

                <TimelineBlocks
                  sessions={sessions}
                  hourHeight={hourHeight}
                  dayStartMs={dayStartMs}
                  onEdit={openEntryEditor}
                  t={t}
                />

                {liveBlocks.map((block) => {
                  const meta = KIND_META[block.kind];
                  const fg = ACTIVITY_FG[meta.gradKey];
                  return (
                    <LinearGradient
                      key={`live-${block.kind}`}
                      colors={ACTIVITY_GRADIENTS[meta.gradKey]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.block,
                        styles.liveBlock,
                        {
                          top: block.top,
                          height: block.height,
                          left: laneLeft(block.kind),
                          borderColor: ACTIVITY_ACCENT[meta.gradKey],
                        },
                      ]}>
                      {block.height >= 16 && (
                        <View style={styles.blockContent}>
                          <View style={styles.blockRow}>
                            <MaterialCommunityIcons name={meta.icon} size={14} color={fg} />
                            <ThemedText
                              style={[styles.blockTitle, { color: fg }]}
                              numberOfLines={1}>
                              {t(`kind.${block.kind}`)}
                            </ThemedText>
                          </View>
                          {block.height >= 34 && (
                            <ThemedText
                              style={[styles.blockTime, { color: fg }]}
                              numberOfLines={1}>
                              {fmtTime(block.start)}–{t('calendar.now')}
                            </ThemedText>
                          )}
                        </View>
                      )}
                    </LinearGradient>
                  );
                })}

                {isToday && (
                  <View style={[styles.nowLine, { top: px(nowMinutes) }]} pointerEvents="none">
                    <View style={styles.nowDot} />
                    <View style={styles.nowBar} />
                  </View>
                )}
              </View>
            </ScrollView>
          </GestureDetector>

          {sessions.length === 0 && (
            <View style={styles.emptyOverlay} pointerEvents="none">
              <ThemedText type="small" themeColor="textSecondary">
                {t('calendar.empty')}
              </ThemedText>
            </View>
          )}

          <ZoomBadge label={zoomLabel} zoom={zoom} />

          <Modal visible={statsVisible} transparent animationType="fade" onRequestClose={() => setStatsVisible(false)}>
            <Pressable style={styles.modalBackdrop} onPress={() => setStatsVisible(false)}>
              <BlurView
                experimentalBlurMethod="dimezisBlurView"
                intensity={45}
                tint="dark"
                pointerEvents="none"
                style={styles.modalBlur}
              />
              <Pressable style={[styles.modalCard, { backgroundColor: theme.background }]} onPress={() => {}}>
                <ThemedText style={styles.modalTitle}>{t('calendar.stats')}</ThemedText>
                <View style={styles.statRow}>
                  <MaterialCommunityIcons name="moon-waning-crescent" size={24} color={ACTIVITY_ACCENT.sleep} />
                  <ThemedText style={styles.statLabel}>{t('kind.sleep')}</ThemedText>
                  <ThemedText type="smallBold">
                    {formatDuration(sleepMs, t('unit.hours'), t('unit.minutes'))}
                  </ThemedText>
                </View>
                <View style={styles.statRow}>
                  <MaterialCommunityIcons name="white-balance-sunny" size={24} color={ACTIVITY_ACCENT.awake} />
                  <ThemedText style={styles.statLabel}>{t('kind.awake')}</ThemedText>
                  <ThemedText type="smallBold">
                    {formatDuration(awakeMs, t('unit.hours'), t('unit.minutes'))}
                  </ThemedText>
                </View>
                <View style={styles.statRow}>
                  <MaterialCommunityIcons name="baby-bottle-outline" size={24} color={ACTIVITY_ACCENT.feed} />
                  <ThemedText style={styles.statLabel}>{t('calendar.milk')}</ThemedText>
                  <ThemedText type="smallBold">{milkMl} {t('unit.ml')}</ThemedText>
                </View>
                <View
                  style={styles.statRow}
                  accessible
                  accessibilityLabel={`${t('kind.poop')}: ${poopCount}`}>
                  <MaterialCommunityIcons name="emoticon-poop" size={24} color={ACTIVITY_ACCENT.poop} />
                  <View style={styles.statSpacer} />
                  <ThemedText type="smallBold">{poopCount}</ThemedText>
                </View>
                <View
                  style={styles.statRow}
                  accessible
                  accessibilityLabel={`${t('kind.diaper')}: ${diaperCount}`}>
                  <MaterialCommunityIcons name="diaper-outline" size={24} color={ACTIVITY_ACCENT.diaper} />
                  <View style={styles.statSpacer} />
                  <ThemedText type="smallBold">{diaperCount}</ThemedText>
                </View>
              </Pressable>
            </Pressable>
          </Modal>

          <Modal visible={!!entryToEdit} transparent animationType="fade" onRequestClose={closeEntryEditor}>
            <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <BlurView
                experimentalBlurMethod="dimezisBlurView"
                intensity={45}
                tint="dark"
                pointerEvents="none"
                style={styles.modalBlur}
              />
              <Pressable style={StyleSheet.absoluteFill} onPress={closeEntryEditor} />
              <View style={[styles.modalCard, { backgroundColor: theme.background }]}>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>
                    {entryToEdit ? t(`kind.${entryToEdit.kind}`) : t('activity.title')}
                  </ThemedText>
                  <Pressable
                    accessibilityLabel={t('editor.delete')}
                    onPress={deleteEntry}
                    hitSlop={12}
                    style={({ pressed }) => pressed && styles.pressed}>
                    <MaterialCommunityIcons name="trash-can-outline" size={24} color={DANGER_COLOR} />
                  </Pressable>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {editingEvent
                    ? t('editor.editStart', { n: EVENT_DURATION_MS / 60000 })
                    : t('editor.editTimes')}
                </ThemedText>
                <View style={styles.timeFields}>
                  <View style={styles.timeField}>
                    <ThemedText type="small" themeColor="textSecondary">{t('editor.start')}</ThemedText>
                    <TextInput
                      value={startInput}
                      onChangeText={(value) => { setStartInput(normalizeTimeInput(value)); setEditorError(''); }}
                      keyboardType="number-pad"
                      maxLength={5}
                      placeholder="00:00"
                      placeholderTextColor={theme.textSecondary}
                      style={[styles.timeInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                    />
                  </View>
                  {!editingEvent && (
                    <View style={styles.timeField}>
                      <ThemedText type="small" themeColor="textSecondary">{t('editor.end')}</ThemedText>
                      <TextInput
                        value={endInput}
                        onChangeText={(value) => { setEndInput(normalizeTimeInput(value)); setEditorError(''); }}
                        keyboardType="number-pad"
                        maxLength={5}
                        placeholder="00:00"
                        placeholderTextColor={theme.textSecondary}
                        style={[styles.timeInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                      />
                    </View>
                  )}
                </View>
                {entryToEdit?.kind === 'feeding' && (
                  <>
                    <ThemedText type="small" themeColor="textSecondary">{t('editor.milkAmount')}</ThemedText>
                    <View style={[styles.inputRow, { backgroundColor: theme.backgroundElement }]}>
                      <TextInput
                        value={milkInput}
                        onChangeText={(value) => { setMilkInput(value.replace(/[^0-9]/g, '')); setEditorError(''); }}
                        keyboardType="number-pad"
                        maxLength={4}
                        placeholder="0"
                        placeholderTextColor={theme.textSecondary}
                        style={[styles.milkInput, { color: theme.text }]}
                      />
                      <ThemedText type="smallBold">{t('unit.ml')}</ThemedText>
                    </View>
                  </>
                )}
                {!!editorError && <ThemedText style={styles.errorText}>{editorError}</ThemedText>}
                <Pressable
                  onPress={saveEntry}
                  style={({ pressed }) => [
                    styles.saveButton,
                    { backgroundColor: theme.text },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText style={[styles.saveButtonText, { color: theme.background }]}>{t('editor.save')}</ThemedText>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </SafeAreaView>
      </ThemedView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    paddingBottom: Spacing.three,
  },
  backBtn: {
    position: 'absolute',
    left: Spacing.four,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsBtn: {
    position: 'absolute',
    right: Spacing.four,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.5,
  },
  dateBlock: {
    alignItems: 'center',
  },
  dateDay: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SCROLL_BOTTOM_PAD,
  },
  timeline: {
    position: 'relative',
  },
  hourLine: {
    position: 'absolute',
    left: GUTTER,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  minorLine: {
    position: 'absolute',
    left: GUTTER,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  hourLabel: {
    position: 'absolute',
    left: 0,
    width: GUTTER - 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  hourNum: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '600',
  },
  hourSup: {
    fontSize: 9,
    lineHeight: 11,
    marginLeft: 1,
  },
  minorLabel: {
    position: 'absolute',
    left: 0,
    width: GUTTER - 8,
    textAlign: 'right',
    fontSize: 9,
    lineHeight: 11,
  },
  block: {
    position: 'absolute',
    left: GUTTER,
    right: Spacing.two,
    borderRadius: 8,
    overflow: 'hidden',
  },
  blockGradient: {
    flex: 1,
  },
  liveBlock: {
    borderWidth: 2,
  },
  eventBlock: {
    position: 'absolute',
    right: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: Spacing.two,
  },
  eventStripes: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 6,
    overflow: 'hidden',
  },
  eventStripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: STRIPE_THICKNESS,
    transform: [{ skewX: STRIPE_SKEW }],
  },
  blockContent: {
    paddingHorizontal: Spacing.two,
    paddingTop: 2,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  blockTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  blockTime: {
    fontSize: 11,
    marginTop: 1,
    opacity: 0.85,
  },
  nowLine: {
    position: 'absolute',
    left: GUTTER - 4,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: NOW_COLOR,
  },
  nowBar: {
    flex: 1,
    height: 2,
    backgroundColor: NOW_COLOR,
  },
  emptyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBadgeWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBadge: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.78)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  zoomBadgeText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalBlur: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: '#3A3D43',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  modalTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 40,
  },
  statLabel: {
    flex: 1,
  },
  statSpacer: {
    flex: 1,
  },
  timeFields: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  timeField: {
    flex: 1,
    gap: Spacing.one,
  },
  timeInput: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  milkInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    paddingVertical: Spacing.three,
  },
  saveButton: {
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: DANGER_COLOR,
    fontSize: 13,
    lineHeight: 18,
  },
  disabled: {
    opacity: 0.35,
  },
  monthSafe: {
    flex: 1,
    alignItems: 'center',
  },
  monthTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  monthCard: {
    alignSelf: 'stretch',
    marginHorizontal: Spacing.four,
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
  },
  weekRow: {
    flexDirection: 'row',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3c87f7',
  },
});
