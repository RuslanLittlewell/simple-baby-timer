import { NunitoSans_400Regular } from '@expo-google-fonts/nunito-sans';
import { Circle, Rect, useFont } from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { CartesianChart, Line, Scatter, useChartPressState } from 'victory-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing, type ThemeMode } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  growthChartDayLabel,
  growthChartDayTicks,
  growthChartDomain,
  growthChartPoints,
  type GrowthMetric,
} from '@/lib/growth-chart';
import {
  formatMeasurementDate,
  formatMeasurementNumber,
  type GrowthMeasurement,
} from '@/lib/growth-measurements';
import { useAppStore, useT } from '@/state/app-state';

// Checked against both card surfaces for lightness, colour-blind separation and contrast.
const METRIC_COLORS: Record<ThemeMode, Record<GrowthMetric, string>> = {
  dark: { weight: '#9085e9', height: '#199e70' },
  light: { weight: '#6250d6', height: '#169a6b' },
};

const METRICS: readonly GrowthMetric[] = ['weight', 'height'];
const METRIC_LABEL = { weight: 'growth.weight', height: 'growth.height' } as const;
const METRIC_UNIT = { weight: 'unit.kg', height: 'unit.cm' } as const;

const PLOT_HEIGHT = 150;
const LINE_ANIMATION = { type: 'timing', duration: 300 } as const;

interface GrowthChartProps {
  /** The child's measurements; the chart needs at least two to draw a line. */
  measurements: readonly GrowthMeasurement[];
}

export function GrowthChart({ measurements }: GrowthChartProps) {
  const theme = useTheme();
  const t = useT();
  const language = useAppStore((state) => state.language);
  const themeMode = useAppStore((state) => state.themeMode);
  const axisFont = useFont(NunitoSans_400Regular, 10);
  const [metric, setMetric] = useState<GrowthMetric>('weight');
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  const { state: press, isActive: pressing } = useChartPressState({ x: 0, y: { value: 0 } });

  const points = useMemo(() => growthChartPoints(measurements, metric), [measurements, metric]);
  const data = useMemo(() => points.map(({ day, value }) => ({ day, value })), [points]);

  useAnimatedReaction(
    () => (press.isActive.value ? press.matchedIndex.value : -1),
    (index, previous) => {
      if (index !== previous) runOnJS(setPressedIndex)(index < 0 ? null : index);
    },
  );

  if (points.length < 2) return null;

  const colors = METRIC_COLORS[themeMode];
  const color = colors[metric];
  const first = points[0];
  const last = points[points.length - 1];
  const spanDays = last.day - first.day;
  // The readout names the latest measurement, or the one under the finger.
  const shown = (pressing && pressedIndex !== null ? points[pressedIndex] : undefined) ?? last;
  const formatValue = (value: number) =>
    `${formatMeasurementNumber(value, language)} ${t(METRIC_UNIT[metric])}`;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.readout}>
          <ThemedText style={styles.readoutValue}>{formatValue(shown.value)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatMeasurementDate(shown.measuredOn)}
          </ThemedText>
        </View>
        <View
          accessibilityRole="tablist"
          style={[styles.switch, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          {METRICS.map((item) => {
            const selected = item === metric;
            return (
              <Pressable
                key={item}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setMetric(item)}
                hitSlop={4}
                style={[styles.switchOption, selected && { backgroundColor: theme.backgroundSelected }]}>
                <View style={[styles.lineKey, { backgroundColor: colors[item] }]} />
                <ThemedText type="smallBold" themeColor={selected ? 'text' : 'textSecondary'}>
                  {t(METRIC_LABEL[item])}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={t('growth.chartAccessibility', {
          metric: t(METRIC_LABEL[metric]),
          count: points.length,
          from: formatMeasurementDate(first.measuredOn),
          to: formatMeasurementDate(last.measuredOn),
          value: formatValue(last.value),
        })}
        style={styles.plot}>
        {axisFont && (
          <CartesianChart
            data={data}
            xKey="day"
            yKeys={['value']}
            domain={growthChartDomain(points)}
            domainPadding={{ left: 20, right: 20, top: 8, bottom: 8 }}
            chartPressState={press}
            xAxis={{
              font: axisFont,
              tickValues: growthChartDayTicks(points),
              labelColor: theme.textSecondary,
              lineColor: 'transparent',
              formatXLabel: (day) => growthChartDayLabel(day, spanDays),
            }}
            yAxis={[
              {
                font: axisFont,
                tickCount: 4,
                labelColor: theme.textSecondary,
                lineColor: theme.border,
                lineWidth: StyleSheet.hairlineWidth,
                formatYLabel: (value) => formatMeasurementNumber(value, language),
              },
            ]}>
            {({ points: chartPoints, chartBounds }) => (
              <>
                <Line
                  points={chartPoints.value}
                  color={color}
                  strokeWidth={2}
                  strokeCap="round"
                  strokeJoin="round"
                  curveType="linear"
                  animate={LINE_ANIMATION}
                />
                <Scatter
                  points={chartPoints.value}
                  radius={6}
                  color={theme.background}
                  animate={LINE_ANIMATION}
                />
                <Scatter points={chartPoints.value} radius={4} color={color} animate={LINE_ANIMATION} />
                {pressing && (
                  <PressIndicator
                    x={press.x.position}
                    y={press.y.value.position}
                    top={chartBounds.top}
                    bottom={chartBounds.bottom}
                    color={color}
                    ringColor={theme.background}
                    lineColor={theme.textSecondary}
                  />
                )}
              </>
            )}
          </CartesianChart>
        )}
      </View>
    </View>
  );
}

interface PressIndicatorProps {
  x: SharedValue<number>;
  y: SharedValue<number>;
  top: number;
  bottom: number;
  color: string;
  ringColor: string;
  lineColor: string;
}

/** A hairline at the measurement under the finger, with that point lifted above the rest. */
function PressIndicator({ x, y, top, bottom, color, ringColor, lineColor }: PressIndicatorProps) {
  const lineX = useDerivedValue(() => x.value - 0.5);
  return (
    <>
      <Rect x={lineX} y={top} width={1} height={bottom - top} color={lineColor} opacity={0.6} />
      <Circle cx={x} cy={y} r={7} color={ringColor} />
      <Circle cx={x} cy={y} r={5} color={color} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  readout: {
    flexShrink: 1,
  },
  readoutValue: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  switch: {
    flexDirection: 'row',
    padding: Spacing.half,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
  },
  switchOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + Spacing.half,
    borderRadius: Spacing.three - Spacing.half,
  },
  lineKey: {
    width: 12,
    height: 3,
    borderRadius: 2,
  },
  plot: {
    height: PLOT_HEIGHT,
  },
});
