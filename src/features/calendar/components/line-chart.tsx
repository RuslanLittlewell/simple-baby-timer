import { NunitoSans_400Regular } from '@expo-google-fonts/nunito-sans';
import { useFont } from '@shopify/react-native-skia';
import { useEffect, useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { CartesianChart, StackedArea } from 'victory-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { CHART_ZOOM_MAX, CHART_ZOOM_MIN } from '../constants';

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
}

interface LineChartProps {
  labels: string[];
  series: ChartSeries[];
  unit: string;
  scale?: 'hours' | 'plain';
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  height?: number;
}

type ChartDatum = { x: number } & Record<string, number>;

const PAD_LEFT = 36;
const PAD_RIGHT = 6;
const AXIS_HEIGHT = 18;
const MIN_TICK_GAP = 26;

const distanceOf = (touches: { pageX: number; pageY: number }[]) =>
  Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);

function niceMax(value: number) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5, 10]) {
    const candidate = step * magnitude;
    if (candidate >= value) return candidate;
  }
  return 10 * magnitude;
}

function formatHours(value: number) {
  const totalMinutes = Math.round(value * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? String(hours) : `${hours}:${String(minutes).padStart(2, '0')}`;
}

export function LineChart({
  labels,
  series,
  unit,
  scale = 'plain',
  zoom = 1,
  onZoomChange,
  height = 150,
}: LineChartProps) {
  const theme = useTheme();
  const axisFont = useFont(NunitoSans_400Regular, 9);
  const viewportHeight = height - AXIS_HEIGHT;
  const chartHeight = viewportHeight * zoom;
  const labelStep = Math.ceil(labels.length / 7);
  const yKeys = useMemo(() => series.map((item) => item.key), [series]);
  const data = useMemo<ChartDatum[]>(
    () =>
      labels.map((_, index) => {
        const datum: ChartDatum = { x: index };
        series.forEach((item) => {
          datum[item.key] = item.values[index] ?? 0;
        });
        return datum;
      }),
    [labels, series],
  );
  const max = niceMax(
    Math.max(
      ...labels.map((_, index) =>
        series.reduce((total, item) => total + (item.values[index] ?? 0), 0),
      ),
      0,
    ),
  );

  const offset = useSharedValue(0);
  const bounds = useRef({ min: 0, max: 0 });
  const zoomRef = useRef(zoom);
  const zoomChangeRef = useRef(onZoomChange);
  const drag = useRef<{ offset: number; dy: number } | null>(null);
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  bounds.current = { min: Math.min(0, viewportHeight - chartHeight), max: 0 };
  zoomRef.current = zoom;
  zoomChangeRef.current = onZoomChange;

  const previousHeight = useRef(chartHeight);
  useEffect(() => {
    const ratio = previousHeight.current > 0 ? chartHeight / previousHeight.current : 1;
    previousHeight.current = chartHeight;
    const centered = (offset.value - viewportHeight / 2) * ratio + viewportHeight / 2;
    offset.value = Math.max(bounds.current.min, Math.min(bounds.current.max, centered));
  }, [chartHeight, offset, viewportHeight]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: (event) => event.nativeEvent.touches.length > 1,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          drag.current = null;
          pinch.current = null;
        },
        onPanResponderMove: (event, gesture) => {
          const touches = event.nativeEvent.touches;
          if (touches.length > 1) {
            const distance = distanceOf(touches);
            drag.current = null;
            if (!pinch.current) {
              pinch.current = { distance, zoom: zoomRef.current };
              return;
            }
            if (pinch.current.distance <= 0) return;
            const next = pinch.current.zoom * (distance / pinch.current.distance);
            zoomChangeRef.current?.(
              Math.max(CHART_ZOOM_MIN, Math.min(CHART_ZOOM_MAX, next)),
            );
            return;
          }
          pinch.current = null;
          if (!drag.current) drag.current = { offset: offset.value, dy: gesture.dy };
          const next = drag.current.offset + gesture.dy - drag.current.dy;
          offset.value = Math.max(bounds.current.min, Math.min(bounds.current.max, next));
        },
        onPanResponderRelease: () => {
          drag.current = null;
          pinch.current = null;
        },
      }),
    [offset],
  );

  const panStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));

  return (
    <View style={styles.chart}>
      <ThemedText type="small" themeColor="textSecondary">
        {unit}
      </ThemedText>
      <View style={[styles.viewport, { height: viewportHeight }]} {...responder.panHandlers}>
        <Animated.View style={[{ height: chartHeight }, panStyle]}>
          {axisFont && data.length > 0 && (
            <CartesianChart
              data={data}
              xKey="x"
              yKeys={yKeys}
              domain={{ y: [0, max] }}
              padding={{ left: PAD_LEFT, right: PAD_RIGHT, top: 8, bottom: 4 }}
              yAxis={[
                {
                  font: axisFont,
                  tickCount: Math.max(2, Math.floor(chartHeight / MIN_TICK_GAP)),
                  labelColor: theme.textSecondary,
                  lineColor: theme.border,
                  formatYLabel: (value) =>
                    scale === 'hours' ? formatHours(value) : String(Math.round(value)),
                },
              ]}
              xAxis={{ tickCount: 0, lineColor: 'transparent' }}
            >
              {({ points, chartBounds }) => (
                <StackedArea
                  points={yKeys.map((key) => points[key])}
                  y0={chartBounds.bottom}
                  colors={series.map((item) => item.color)}
                  curveType="natural"
                  animate={{ type: 'timing', duration: 480 }}
                  areaOptions={({ rowIndex }) => ({
                    opacity: series.length === 1 ? 0.58 : 0.46 + rowIndex * 0.08,
                    antiAlias: true,
                  })}
                />
              )}
            </CartesianChart>
          )}
        </Animated.View>
      </View>
      <View style={styles.xAxis}>
        {labels.map((label, index) => (
          <ThemedText
            key={`${label}-${index}`}
            type="small"
            themeColor="textSecondary"
            style={[styles.xLabel, { opacity: index % labelStep === 0 ? 1 : 0 }]}
          >
            {label}
          </ThemedText>
        ))}
      </View>
      {series.length > 1 && (
        <View style={styles.legend}>
          {series.map((item) => (
            <View key={item.key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <ThemedText type="small" themeColor="textSecondary">
                {item.label}
              </ThemedText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { gap: Spacing.one },
  viewport: { overflow: 'hidden' },
  xAxis: {
    height: AXIS_HEIGHT,
    paddingLeft: PAD_LEFT,
    paddingRight: PAD_RIGHT,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  xLabel: { flex: 1, fontSize: 9, lineHeight: 12, textAlign: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
});
