import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useActivityColors } from '@/hooks/use-activity-colors';
import { useTheme } from '@/hooks/use-theme';
import { MONTHS_I18N, WEEKDAYS_I18N } from '@/i18n';
import { getSessionsInRange } from '@/lib/activity-store';
import { useAppStore, useT } from '@/state/app-state';

import { CHART_ZOOM_MIN } from '../constants';
import {
  computeDayStats,
  formatDuration,
  pad2,
  startOfWeek,
  type DayStats,
} from '../helpers';
import { modalStyles } from '../modal-styles';
import { LineChart, type ChartSeries } from './line-chart';
import { VerticalZoom } from './vertical-zoom';

type StatsTab = 'day' | 'week' | 'month';
const TABS: StatsTab[] = ['day', 'week', 'month'];
const HOUR = 3_600_000;

interface DayPoint {
  dayStartMs: number;
  stats: DayStats;
}

interface StatsModalProps {
  visible: boolean;
  onClose: () => void;
  // The day the caller was looking at; every period starts anchored to it.
  day: Date;
}

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

// The period the cursor currently points at, as [start, end) plus the number of
// days it spans — everything else in the modal derives from this.
function periodOf(tab: StatsTab, cursor: Date) {
  if (tab === 'day') {
    const start = startOfDay(cursor);
    return { start, days: 1 };
  }
  if (tab === 'week') return { start: startOfWeek(cursor), days: 7 };
  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  return { start, days };
}

const shiftCursor = (tab: StatsTab, cursor: Date, delta: number) => {
  if (tab === 'day') {
    return new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + delta);
  }
  if (tab === 'week') {
    return new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + delta * 7);
  }
  return new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1);
};

export function StatsModal({ visible, onClose, day }: StatsModalProps) {
  const theme = useTheme();
  const { accent } = useActivityColors();
  const t = useT();
  const language = useAppStore((state) => state.language);
  const activeChildId = useAppStore((state) => state.activeChildId);
  const dataVersion = useAppStore((state) => state.dataVersion);
  const liveSession = useAppStore((state) => state.session);
  const [tab, setTab] = useState<StatsTab>('day');
  const [cursor, setCursor] = useState(day);
  const [points, setPoints] = useState<DayPoint[]>([]);
  const [zoom, setZoom] = useState(CHART_ZOOM_MIN);
  const [chartsHeight, setChartsHeight] = useState(0);

  // Every opening starts on the day the caller asked about.
  useEffect(() => {
    if (!visible) return;
    setTab('day');
    setCursor(day);
    setZoom(CHART_ZOOM_MIN);
  }, [visible, day]);

  const { start, days } = periodOf(tab, cursor);
  const startMs = start.getTime();
  const endMs = new Date(start.getFullYear(), start.getMonth(), start.getDate() + days).getTime();

  // Keyed on primitives only: a Date in the dependency list would be a new
  // object every render and the loading effect would never settle.
  const load = useCallback(async () => {
    const sessions = await getSessionsInRange(startMs, endMs, activeChildId);
    const now = Date.now();
    const base = new Date(startMs);
    const next: DayPoint[] = [];
    for (let index = 0; index < days; index++) {
      const dayStart = new Date(
        base.getFullYear(),
        base.getMonth(),
        base.getDate() + index,
      );
      const dayStartMs = dayStart.getTime();
      const dayEndMs = new Date(
        dayStart.getFullYear(),
        dayStart.getMonth(),
        dayStart.getDate() + 1,
      ).getTime();
      // A running timer only lands in the day it actually covers — the helper
      // clamps it to the window.
      next.push({
        dayStartMs,
        stats: computeDayStats(sessions, liveSession, now, dayStartMs, dayEndMs),
      });
    }
    return next;
  }, [startMs, endMs, days, activeChildId, liveSession]);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    load().then((next) => {
      if (alive) setPoints(next);
    });
    return () => {
      alive = false;
    };
  }, [visible, load, dataVersion]);

  const weekdays = WEEKDAYS_I18N[language];
  const months = MONTHS_I18N[language];
  const dmy = (date: Date) =>
    `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;
  const last = new Date(endMs - 1);
  const periodLabel =
    tab === 'day'
      ? dmy(start)
      : tab === 'week'
        ? `${pad2(start.getDate())}.${pad2(start.getMonth() + 1)} – ` +
          `${pad2(last.getDate())}.${pad2(last.getMonth() + 1)}`
        : `${months[start.getMonth()]} ${start.getFullYear()}`;
  // Nothing to show past the period that is still running.
  const atLatest = endMs > Date.now();

  const dayStats = points[0]?.stats;
  const labels = points.map((point) => {
    const date = new Date(point.dayStartMs);
    return tab === 'week' ? weekdays[(date.getDay() + 6) % 7] : String(date.getDate());
  });
  const durationSeries: ChartSeries[] = [
    {
      key: 'sleep',
      label: t('kind.sleep'),
      color: accent.sleep,
      values: points.map((point) => point.stats.sleepMs / HOUR),
    },
    {
      key: 'awake',
      label: t('kind.awake'),
      color: accent.awake,
      values: points.map((point) => point.stats.awakeMs / HOUR),
    },
    {
      key: 'settling',
      label: t('kind.settling'),
      color: accent.settling,
      values: points.map((point) => point.stats.settlingMs / HOUR),
    },
  ];
  const milkSeries: ChartSeries[] = [
    {
      key: 'milk',
      label: t('kind.feeding'),
      color: accent.feed,
      values: points.map((point) => point.stats.milkMl),
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* The closer is a sibling under the card, never an ancestor of it: as a
          wrapper it would fight the chart for the touch responder and fire on
          multi-touch. */}
      <View style={[modalStyles.backdrop, styles.backdrop]}>
        <BlurView
          experimentalBlurMethod="dimezisBlurView"
          intensity={45}
          tint="dark"
          pointerEvents="none"
          style={modalStyles.blur}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[modalStyles.card, styles.card, { backgroundColor: theme.background }]}>
          <View style={modalStyles.header}>
            <ThemedText style={modalStyles.title}>{t('calendar.stats')}</ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('editor.cancel')}
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => pressed && modalStyles.pressed}>
              <MaterialCommunityIcons name="close" size={24} color={theme.text} />
            </Pressable>
          </View>

          <View style={[styles.tabs, { backgroundColor: theme.backgroundElement }]}>
            {TABS.map((item) => {
              const selected = item === tab;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setTab(item)}
                  style={({ pressed }) => [
                    styles.tab,
                    selected && { backgroundColor: theme.backgroundSelected },
                    pressed && modalStyles.pressed,
                  ]}>
                  <ThemedText type="smallBold" themeColor={selected ? 'text' : 'textSecondary'}>
                    {t(`stats.${item}`)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.nav}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('editor.prevDay')}
              onPress={() => setCursor((current) => shiftCursor(tab, current, -1))}
              hitSlop={12}
              style={({ pressed }) => pressed && modalStyles.pressed}>
              <MaterialCommunityIcons name="chevron-left" size={26} color={theme.text} />
            </Pressable>
            <ThemedText type="smallBold" style={styles.navLabel}>
              {periodLabel}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('editor.nextDay')}
              disabled={atLatest}
              onPress={() => setCursor((current) => shiftCursor(tab, current, 1))}
              hitSlop={12}
              style={({ pressed }) => pressed && modalStyles.pressed}>
              <MaterialCommunityIcons
                name="chevron-right"
                size={26}
                color={atLatest ? theme.textSecondary : theme.text}
              />
            </Pressable>
          </View>

          {tab === 'day' ? (
            <>
              <View style={styles.statRow}>
                <MaterialCommunityIcons
                  name="moon-waning-crescent"
                  size={24}
                  color={accent.sleep}
                />
                <ThemedText style={styles.statLabel}>{t('kind.sleep')}</ThemedText>
                <ThemedText type="smallBold">
                  {formatDuration(dayStats?.sleepMs ?? 0, t('unit.hours'), t('unit.minutes'))}
                </ThemedText>
              </View>
              <View style={styles.statRow}>
                <MaterialCommunityIcons
                  name="white-balance-sunny"
                  size={24}
                  color={accent.awake}
                />
                <ThemedText style={styles.statLabel}>{t('kind.awake')}</ThemedText>
                <ThemedText type="smallBold">
                  {formatDuration(dayStats?.awakeMs ?? 0, t('unit.hours'), t('unit.minutes'))}
                </ThemedText>
              </View>
              <View style={styles.statRow}>
                <MaterialCommunityIcons name="sleep" size={24} color={accent.settling} />
                <ThemedText style={styles.statLabel}>{t('kind.settling')}</ThemedText>
                <ThemedText type="smallBold">
                  {formatDuration(dayStats?.settlingMs ?? 0, t('unit.hours'), t('unit.minutes'))}
                </ThemedText>
              </View>
              <View style={styles.statRow}>
                <MaterialCommunityIcons
                  name="baby-bottle-outline"
                  size={24}
                  color={accent.feed}
                />
                <ThemedText style={styles.statLabel}>{t('kind.feeding')}</ThemedText>
                <ThemedText type="smallBold">
                  {dayStats?.milkMl ?? 0} {t('unit.ml')}
                </ThemedText>
              </View>
              <View
                style={styles.statRow}
                accessible
                accessibilityLabel={`${t('kind.poop')}: ${dayStats?.poopCount ?? 0}`}>
                <MaterialCommunityIcons name="emoticon-poop" size={24} color={accent.poop} />
                <View style={styles.statSpacer} />
                <ThemedText type="smallBold">{dayStats?.poopCount ?? 0}</ThemedText>
              </View>
              <View
                style={styles.statRow}
                accessible
                accessibilityLabel={`${t('kind.diaper')}: ${dayStats?.diaperCount ?? 0}`}>
                <MaterialCommunityIcons
                  name="diaper-outline"
                  size={24}
                  color={accent.diaper}
                />
                <View style={styles.statSpacer} />
                <ThemedText type="smallBold">{dayStats?.diaperCount ?? 0}</ThemedText>
              </View>
            </>
          ) : (
            <View style={styles.periodRow}>
              <View
                style={styles.period}
                onLayout={(event) => setChartsHeight(event.nativeEvent.layout.height)}>
                <LineChart
                  labels={labels}
                  series={durationSeries}
                  unit={t('unit.hours')}
                  scale="hours"
                  zoom={zoom}
                  onZoomChange={setZoom}
                />
                <LineChart
                  labels={labels}
                  series={milkSeries}
                  unit={`${t('kind.feeding')}, ${t('unit.ml')}`}
                  zoom={zoom}
                  onZoomChange={setZoom}
                />
              </View>
              {chartsHeight > 0 && (
                <VerticalZoom value={zoom} length={chartsHeight} onChange={setZoom} />
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Charts need the room, so this modal runs wider and tighter to the edges
  // than the shared sheet layout.
  backdrop: {
    padding: Spacing.two,
  },
  card: {
    maxWidth: 560,
    padding: Spacing.three,
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.one,
    padding: Spacing.half,
    borderRadius: Spacing.three,
  },
  tab: {
    flex: 1,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.three - 2,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navLabel: {
    fontVariant: ['tabular-nums'],
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  period: {
    flex: 1,
    gap: Spacing.three,
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
});
