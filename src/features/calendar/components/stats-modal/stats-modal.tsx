import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useActivityColors } from '@/hooks/use-activity-colors';
import { useTheme } from '@/hooks/use-theme';
import { WEEKDAYS_I18N } from '@/i18n';
import { loadChildHistoryRange } from '@/lib/sync';
import { useAppStore, useT } from '@/state/app-state';

import { CHART_ZOOM_MIN } from '../../constants';
import { formatDuration } from '../../helpers';
import { modalStyles } from '../../modal-styles';
import { LineChart, type ChartSeries } from '../line-chart';
import { VerticalZoom } from '../vertical-zoom';
import {
  averageOf,
  buildDayPoints,
  formatPeriodLabel,
  HOUR,
  periodOf,
  previousPeriodOf,
  shiftCursor,
  TABS,
  type DayPoint,
  type StatsTab,
} from './helpers';
import { styles } from './styles';

interface StatsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function StatsModal({ visible, onClose }: StatsModalProps) {
  const theme = useTheme();
  const { accent } = useActivityColors();
  const t = useT();
  const language = useAppStore((state) => state.language);
  const activeChildId = useAppStore((state) => state.activeChildId);
  const children = useAppStore((state) => state.children);
  const dataVersion = useAppStore((state) => state.dataVersion);
  const liveSession = useAppStore((state) => state.session);
  const [tab, setTab] = useState<StatsTab>('day');
  const [cursor, setCursor] = useState(() => new Date());
  const [points, setPoints] = useState<DayPoint[]>([]);
  const [previousPoints, setPreviousPoints] = useState<DayPoint[]>([]);
  const [zoom, setZoom] = useState(CHART_ZOOM_MIN);
  const [chartsHeight, setChartsHeight] = useState(0);
  const activeChild = children.find((child) => child.id === activeChildId);

  const selectTab = (nextTab: StatsTab) => {
    if (nextTab === tab) return;
    setCursor((current) => {
      if (nextTab === 'day') return new Date();
      if (nextTab === 'week') {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
      }
      return current;
    });
    setTab(nextTab);
  };

  
  
  useEffect(() => {
    if (!visible) return;
    setTab('day');
    setCursor(new Date());
    setZoom(CHART_ZOOM_MIN);
  }, [visible]);

  const { start, days } = periodOf(tab, cursor);
  const startMs = start.getTime();
  const endMs = new Date(start.getFullYear(), start.getMonth(), start.getDate() + days).getTime();
  const previousPeriod = previousPeriodOf(tab, start, days);
  const previousStartMs = previousPeriod.start.getTime();
  const previousEndMs = new Date(
    previousPeriod.start.getFullYear(),
    previousPeriod.start.getMonth(),
    previousPeriod.start.getDate() + previousPeriod.days,
  ).getTime();

  
  
  const load = useCallback(async () => {
    const now = Date.now();
    if (activeChild?.remoteId) {
      await Promise.all([
        loadChildHistoryRange(activeChild.remoteId, activeChild.id, startMs, endMs),
        loadChildHistoryRange(
          activeChild.remoteId,
          activeChild.id,
          previousStartMs,
          previousEndMs,
        ),
      ]).catch(() => {});
    }
    return Promise.all([
      buildDayPoints(startMs, endMs, days, activeChildId, liveSession, now),
      buildDayPoints(
        previousStartMs,
        previousEndMs,
        previousPeriod.days,
        activeChildId,
        liveSession,
        now,
      ),
    ]);
  }, [
    startMs,
    endMs,
    days,
    previousStartMs,
    previousEndMs,
    previousPeriod.days,
    activeChildId,
    activeChild?.id,
    activeChild?.remoteId,
    liveSession,
  ]);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    load().then(([next, previous]) => {
      if (alive) {
        setPoints(next);
        setPreviousPoints(previous);
      }
    });
    return () => {
      alive = false;
    };
  }, [visible, load, dataVersion]);

  const weekdays = WEEKDAYS_I18N[language];
  const periodLabel = formatPeriodLabel(tab, start, endMs, language);
  
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
  const comparisons = [
    { key: 'sleepMs' as const, label: t('kind.sleep'), color: accent.sleep, unit: 'duration' },
    { key: 'awakeMs' as const, label: t('kind.awake'), color: accent.awake, unit: 'duration' },
    {
      key: 'settlingMs' as const,
      label: t('kind.settling'),
      color: accent.settling,
      unit: 'duration',
    },
    { key: 'milkMl' as const, label: t('kind.feeding'), color: accent.feed, unit: 'milk' },
  ].map((item) => {
    const average = averageOf(points, item.key);
    const previousAverage = averageOf(previousPoints, item.key);
    return {
      ...item,
      value:
        average === null
          ? '—'
          : item.unit === 'milk'
          ? `${Math.round(average)} ${t('unit.ml')}`
          : formatDuration(average, t('unit.hours'), t('unit.minutes')),
      difference:
        average === null || previousAverage === null
          ? null
          : average - previousAverage,
    };
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      
      <View style={[modalStyles.backdrop, styles.backdrop]}>
        <BlurView
          experimentalBlurMethod="dimezisBlurView"
          intensity={45}
          tint="dark"
          pointerEvents="none"
          style={modalStyles.blur}
        />
        <Pressable style={styles.absoluteFill} onPress={onClose} />
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
                  onPress={() => selectTab(item)}
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

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}>
          {tab === 'day' ? (
            <View style={styles.dayStats}>
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
              <View
                style={styles.statRow}
                accessible
                accessibilityLabel={`${t('kind.nightWaking')}: ${dayStats?.nightWakingCount ?? 0}`}>
                <MaterialCommunityIcons
                  name="power-sleep"
                  size={24}
                  color={accent.nightWaking}
                />
                <ThemedText style={styles.statLabel}>{t('kind.nightWaking')}</ThemedText>
                <ThemedText type="smallBold">{dayStats?.nightWakingCount ?? 0}</ThemedText>
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
            </View>
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
          <View style={[styles.comparison, { backgroundColor: theme.backgroundElement }]}>
            {comparisons.map((item) => {
              const positive = item.difference !== null && item.difference > 0;
              const negative = item.difference !== null && item.difference < 0;
              const difference =
                item.difference === null
                  ? '—'
                  : `${item.difference > 0 ? '+' : item.difference < 0 ? '−' : ''}${
                      item.unit === 'milk'
                        ? `${Math.round(Math.abs(item.difference))} ${t('unit.ml')}`
                        : formatDuration(
                            Math.abs(item.difference),
                            t('unit.hours'),
                            t('unit.minutes'),
                          )
                    }`;
              return (
                <View key={item.key} style={styles.comparisonRow}>
                  <View style={[styles.comparisonDot, { backgroundColor: item.color }]} />
                  <ThemedText type="smallBold" style={styles.comparisonLabel}>
                    {item.label}
                  </ThemedText>
                  {tab !== 'day' && <ThemedText type="smallBold">{item.value}</ThemedText>}
                  <ThemedText
                    type="smallBold"
                    style={{
                      color: positive
                        ? '#22A06B'
                        : negative
                          ? theme.danger
                          : theme.textSecondary,
                    }}>
                    {difference}
                  </ThemedText>
                </View>
              );
            })}
          </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
