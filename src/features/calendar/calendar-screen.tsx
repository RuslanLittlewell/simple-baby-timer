import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useProPaywall } from '@/hooks/use-pro-paywall';
import { useTheme } from '@/hooks/use-theme';
import { getSessionsForDay, type ActivitySession } from '@/lib/activity-store';
import { loadChildHistoryRange } from '@/lib/sync';
import { useAppStore, useT } from '@/state/app-state';

import { EntryEditor } from './components/entry-editor';
import { AddActivityModal } from './components/add-activity-modal';
import { MonthView } from './components/month-view';
import { StatsModal } from './components/stats-modal/stats-modal';
import { LiveBlocks, TimelineBlocks, type LiveBlock } from './components/timeline-blocks';
import { TimelineGrid } from './components/timeline-grid';
import { WeekView } from './components/week-view';
import { ZoomBadge } from './components/zoom-badge';
import { GUTTER, NOW_COLOR, SCROLL_BOTTOM_PAD, TIMELINE_Z_INDEX } from './constants';
import { isSameDay, pad2, startOfWeek } from './helpers';
import { usePinchZoom } from './use-pinch-zoom';

export default function CalendarScreen() {
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const didAutoScroll = useRef(false);

  const [today, setToday] = useState(() => new Date());
  const todayRef = useRef(today);
  const [overlay, setOverlay] = useState<'none' | 'week' | 'month'>('none');
  const [shownDay, setShownDay] = useState<Date>(today);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(today));
  const [monthCursor, setMonthCursor] = useState<Date>(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const dataVersion = useAppStore((state) => state.dataVersion);
  const activeChildId = useAppStore((state) => state.activeChildId);
  const children = useAppStore((state) => state.children);
  const session = useAppStore((state) => state.session);
  const feeding = useAppStore((state) => state.feeding);
  const remoteLive = useAppStore((state) => state.remoteLive);
  const proActive = useAppStore((state) => state.proActive);
  const activeChild = children.find((child) => child.id === activeChildId);
  const proAccess = proActive || activeChild?.proEnabled === true;
  const addManualActivity = useAppStore((state) => state.addManualActivity);
  const bumpDataVersion = useAppStore((state) => state.bumpDataVersion);
  const t = useT();
  const openPaywall = useProPaywall();
  const [sessions, setSessions] = useState<ActivitySession[]>([]);
  const [statsVisible, setStatsVisible] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<ActivitySession | null>(null);
  const [addingActivity, setAddingActivity] = useState(false);

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

  useEffect(() => {
    if (!activeChild?.remoteId) return;
    const startMs = new Date(
      shownDay.getFullYear(),
      shownDay.getMonth(),
      shownDay.getDate(),
    ).getTime();
    const endMs = new Date(
      shownDay.getFullYear(),
      shownDay.getMonth(),
      shownDay.getDate() + 1,
    ).getTime();
    void loadChildHistoryRange(activeChild.remoteId, activeChild.id, startMs, endMs)
      .then((applied) => {
        if (applied > 0) bumpDataVersion();
      })
      .catch(() => {});
  }, [activeChild?.id, activeChild?.remoteId, shownDay, bumpDataVersion]);

  useEffect(() => {
    if (!activeChild?.remoteId || overlay === 'none') return;
    const start = overlay === 'week'
      ? weekStart
      : new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const end = overlay === 'week'
      ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)
      : new Date(start.getFullYear(), start.getMonth() + 1, 1);
    void loadChildHistoryRange(activeChild.remoteId, activeChild.id, start.getTime(), end.getTime())
      .then((applied) => {
        if (applied > 0) bumpDataVersion();
      })
      .catch(() => {});
  }, [
    activeChild?.id,
    activeChild?.remoteId,
    overlay,
    weekStart,
    monthCursor,
    bumpDataVersion,
  ]);

  const refreshSessions = useCallback(async () => {
    setSessions(await getSessionsForDay(shownDay, activeChildId));
  }, [shownDay, activeChildId]);

  const openEntryEditor = useCallback((entry: ActivitySession) => setEntryToEdit(entry), []);
  const closeEntryEditor = useCallback(() => setEntryToEdit(null), []);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    syncCurrentDate();
    const id = overlay === 'none' ? setInterval(syncCurrentDate, 1000) : undefined;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncCurrentDate();
    });
    return () => {
      if (id) clearInterval(id);
      subscription.remove();
    };
  }, [syncCurrentDate, overlay]);

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
    setOverlay('week');
  };
  const shiftWeek = (delta: number) =>
    setWeekStart(
      (prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + delta * 7),
    );
  
  const switchPeriod = () => {
    if (overlay === 'week') {
      setMonthCursor(new Date(weekStart.getFullYear(), weekStart.getMonth(), 1));
      setOverlay('month');
      return;
    }
    setOverlay('week');
  };
  const closeOverlay = () => {
    setOverlay('none');
    
    syncCurrentDate();
  };
  const shiftMonth = (delta: number) =>
    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  
  
  const shiftShownDay = (delta: number) =>
    setShownDay(
      (prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + delta),
    );
  const goToDay = (date: Date) => {
    setShownDay(date);
    closeOverlay();
    
    
    const onToday = isSameDay(date, todayRef.current);
    const minutes = onToday
      ? (Date.now() -
          new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) /
        60000
      : 6 * 60;
    const target = (minutes / 60) * hourHeight - (onToday ? 140 : 20);
    scrollRef.current?.scrollTo({ y: Math.max(0, target), animated: false });
  };
  const pickDay = (day: number) =>
    goToDay(new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day));

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
  
  
  
  const openStats = () => {
    if (!proAccess) {
      openPaywall((unlocked) => {
        if (unlocked) setStatsVisible(true);
      });
      return;
    }
    setStatsVisible(true);
  };
  const dayStats = (
    <StatsModal
      visible={statsVisible}
      onClose={() => setStatsVisible(false)}
    />
  );

  const isToday = isSameDay(shownDay, today);
  const nowMinutes = (now - dayStartMs) / 60000;
  const totalHeight = 24 * hourHeight;
  const px = (minutes: number) => (minutes / 60) * hourHeight;

  const clampDayMin = (m: number) => Math.max(0, Math.min(24 * 60, m));
  
  
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
      proDetails: 'proDetails' in item ? item.proDetails : undefined,
    });
  }

  const zoomLabel =
    gridStep === 60 ? `1 ${t('unit.hours')}` : `${gridStep} ${t('unit.minutes')}`;

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemedView gradient style={styles.container}>
        <SafeAreaView
          edges={['top', 'left', 'right']}
          style={[
            styles.safe,
            Platform.OS === 'ios' && Platform.isPad && styles.ipadTopTabsInset,
          ]}>
          <View style={styles.header}>
            <Pressable
              accessibilityLabel={t('calendar.week')}
              onPress={openWeek}
              hitSlop={12}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="calendar-month-outline" size={24} color={theme.text} />
            </Pressable>
            <View style={styles.dateRow}>
              <Pressable
                accessibilityLabel={t('editor.prevDay')}
                onPress={() => shiftShownDay(-1)}
                hitSlop={12}
                style={({ pressed }) => [styles.dayArrow, pressed && styles.pressed]}>
                <MaterialCommunityIcons name="chevron-left" size={30} color={theme.text} />
              </Pressable>
              <View style={styles.dateBlock}>
                <ThemedText style={styles.dateDay}>{pad2(shownDay.getDate())}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {pad2(shownDay.getMonth() + 1)}.{shownDay.getFullYear()}
                </ThemedText>
              </View>
              <Pressable
                accessibilityLabel={t('editor.nextDay')}
                onPress={() => shiftShownDay(1)}
                hitSlop={12}
                style={({ pressed }) => [styles.dayArrow, pressed && styles.pressed]}>
                <MaterialCommunityIcons name="chevron-right" size={30} color={theme.text} />
              </Pressable>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                accessibilityLabel={t('calendar.stats')}
                onPress={openStats}
                hitSlop={12}
                style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}>
                <MaterialCommunityIcons name="chart-box-outline" size={24} color={theme.text} />
              </Pressable>
              <Pressable
                accessibilityLabel={t('manual.title')}
                onPress={() => setAddingActivity(true)}
                hitSlop={12}
                style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}>
                <MaterialCommunityIcons name="plus" size={24} color={theme.text} />
              </Pressable>
            </View>
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
                  hourLineColor={theme.border}
                  minorLineColor={theme.backgroundElement}
                />

                <LiveBlocks blocks={liveBlocks} t={t} />

                <TimelineBlocks
                  sessions={sessions}
                  hourHeight={hourHeight}
                  dayStartMs={dayStartMs}
                  onEdit={openEntryEditor}
                  t={t}
                />

                {isToday && (
                  <View style={[styles.nowLine, { top: px(nowMinutes) }]} pointerEvents="none">
                    <View style={styles.nowDot} />
                    <View style={styles.nowBar} />
                  </View>
                )}
              </View>
            </ScrollView>
          </GestureDetector>

          {sessions.length === 0 && liveBlocks.length === 0 && (
            <View style={styles.emptyOverlay} pointerEvents="none">
              <ThemedText type="small" themeColor="textSecondary">
                {t('calendar.empty')}
              </ThemedText>
            </View>
          )}

          <ZoomBadge label={zoomLabel} zoom={zoom} />

          {dayStats}

          <EntryEditor
            entry={entryToEdit}
            proActive={proAccess}
            onClose={closeEntryEditor}
            onChanged={refreshSessions}
          />
          <AddActivityModal
            visible={addingActivity}
            day={shownDay}
            proActive={proAccess}
            onClose={() => setAddingActivity(false)}
            onSave={addManualActivity}
          />

          
          <Modal
            visible={overlay !== 'none'}
            transparent
            animationType="fade"
            onRequestClose={closeOverlay}>
            {overlay === 'month' ? (
              <MonthView
                monthCursor={monthCursor}
                shownDay={shownDay}
                today={today}
                onShiftMonth={shiftMonth}
                onSwitchPeriod={switchPeriod}
                onClose={closeOverlay}
                onPickDay={pickDay}
              />
            ) : (
              <WeekView
                weekStart={weekStart}
                shownDay={shownDay}
                today={today}
                onShiftWeek={shiftWeek}
                onSwitchPeriod={switchPeriod}
                onClose={closeOverlay}
                onPickDay={goToDay}
              />
            )}
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
  ipadTopTabsInset: {
    paddingTop: 52,
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
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    position: 'absolute',
    right: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerAction: {
    width: 34,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  dayArrow: {
    width: 34,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    zIndex: TIMELINE_Z_INDEX.now,
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
