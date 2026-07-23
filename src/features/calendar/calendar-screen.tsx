import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getSessionsForDay, type ActivitySession } from '@/lib/activity-store';
import { useAppStore, useT } from '@/state/app-state';

import { EntryEditor } from './components/entry-editor';
import { MonthView } from './components/month-view';
import { StatsModal } from './components/stats-modal';
import { LiveBlocks, TimelineBlocks, type LiveBlock } from './components/timeline-blocks';
import { TimelineGrid } from './components/timeline-grid';
import { WeekView } from './components/week-view';
import { ZoomBadge } from './components/zoom-badge';
import { GUTTER, NOW_COLOR, SCROLL_BOTTOM_PAD } from './constants';
import { computeDayStats, isSameDay, pad2, startOfWeek } from './helpers';
import { usePinchZoom } from './use-pinch-zoom';

export default function CalendarScreen() {
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const didAutoScroll = useRef(false);

  const [today, setToday] = useState(() => new Date());
  const todayRef = useRef(today);
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [shownDay, setShownDay] = useState<Date>(today);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(today));
  const [monthCursor, setMonthCursor] = useState<Date>(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const dataVersion = useAppStore((state) => state.dataVersion);
  const activeChildId = useAppStore((state) => state.activeChildId);
  const session = useAppStore((state) => state.session);
  const feeding = useAppStore((state) => state.feeding);
  const remoteLive = useAppStore((state) => state.remoteLive);
  const t = useT();
  const [sessions, setSessions] = useState<ActivitySession[]>([]);
  const [statsVisible, setStatsVisible] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<ActivitySession | null>(null);

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
      setWeekStart((current) =>
        isSameDay(current, startOfWeek(previousToday)) ? startOfWeek(nextToday) : current,
      );
    }
    setNow(nextToday.getTime());
  }, []);

  useEffect(() => {
    let alive = true;
    getSessionsForDay(shownDay, activeChildId).then((list) => {
      if (alive) setSessions(list);
    });
    return () => {
      alive = false;
    };
  }, [shownDay, dataVersion, activeChildId]);

  const refreshSessions = useCallback(async () => {
    setSessions(await getSessionsForDay(shownDay, activeChildId));
  }, [shownDay, activeChildId]);

  const openEntryEditor = useCallback((entry: ActivitySession) => setEntryToEdit(entry), []);
  const closeEntryEditor = useCallback(() => setEntryToEdit(null), []);

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

  const {
    zoom,
    gridStep,
    hourHeight,
    pinching,
    pinchOffset,
    clearPinchOffset,
    pinchGesture,
    scrollY,
    viewportHeight,
    pendingScrollY,
  } = usePinchZoom();

  const openWeek = () => {
    setWeekStart(startOfWeek(shownDay));
    clearPinchOffset();
    setView('week');
  };
  const shiftWeek = (delta: number) =>
    setWeekStart(
      (prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + delta * 7),
    );
  const openMonthFromWeek = () => {
    setMonthCursor(new Date(weekStart.getFullYear(), weekStart.getMonth(), 1));
    setView('month');
  };
  const shiftMonth = (delta: number) =>
    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  const goToDay = (date: Date) => {
    setShownDay(date);
    didAutoScroll.current = false;
    setView('day');
  };
  const pickDay = (day: number) =>
    goToDay(new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day));

  if (view === 'week') {
    return (
      <WeekView
        weekStart={weekStart}
        shownDay={shownDay}
        today={today}
        onShiftWeek={shiftWeek}
        onOpenMonth={openMonthFromWeek}
        onClose={() => setView('day')}
        onPickDay={goToDay}
      />
    );
  }

  if (view === 'month') {
    return (
      <MonthView
        monthCursor={monthCursor}
        shownDay={shownDay}
        today={today}
        onShiftMonth={shiftMonth}
        onBackToWeek={() => setView('week')}
        onClose={() => setView('day')}
        onPickDay={pickDay}
      />
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
  // Partner-run timers for the active child, unless our own timer covers
  // the same track already.
  const remoteLiveItems = remoteLive
    .filter((item) => item.childId === activeChildId)
    .filter((item) => (item.track === 'session' ? !session : !feeding))
    .map((item) => ({ kind: item.kind, startedAt: item.startedAt, childId: item.childId }));
  const liveBlocks: LiveBlock[] = [];
  for (const item of [session, feeding, ...remoteLiveItems]) {
    if (!item || item.startedAt >= dayEndMs || now <= dayStartMs) continue;
    if (activeChildId && item.childId && item.childId !== activeChildId) continue;
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

  const stats = computeDayStats(sessions, session, now, dayStartMs, dayEndMs);
  const zoomLabel =
    gridStep === 60 ? `1 ${t('unit.hours')}` : `${gridStep} ${t('unit.minutes')}`;

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemedView style={styles.container}>
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
          <View style={styles.header}>
            <Pressable
              onPress={openWeek}
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

          <GestureDetector gesture={pinchGesture}>
            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              scrollEnabled={!pinching}
              scrollEventThrottle={16}
              contentOffset={pinchOffset ?? undefined}
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

                <LiveBlocks blocks={liveBlocks} t={t} />

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

          <StatsModal
            visible={statsVisible}
            onClose={() => setStatsVisible(false)}
            stats={stats}
          />

          <EntryEditor
            entry={entryToEdit}
            onClose={closeEntryEditor}
            onChanged={refreshSessions}
          />
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
});
