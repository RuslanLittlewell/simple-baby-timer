import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { NunitoSans, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { CHART_ZOOM_MAX, CHART_ZOOM_MIN } from '../constants';

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
}

interface LineChartProps {
  // One label per x position; only every nth is drawn when they would collide.
  labels: string[];
  series: ChartSeries[];
  // Shown once above the plot instead of repeating on every tick.
  unit: string;
  // Hours get h:mm gridlines once the zoom makes room for them.
  scale?: 'hours' | 'plain';
  // 1 = the whole scale fits the viewport. Above that the plot grows taller and
  // is dragged with a finger, the way the calendar timeline magnifies hours.
  zoom?: number;
  // Pinching the plot drives the same zoom the slider does.
  onZoomChange?: (zoom: number) => void;
  height?: number;
}

const distanceOf = (touches: { pageX: number; pageY: number }[]) =>
  Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);

const PAD_LEFT = 36;
const PAD_RIGHT = 6;
const PLOT_TOP = 8;
const PLOT_BOTTOM = 4;
// The x labels sit outside the panned plot so they stay visible when zoomed.
const AXIS_HEIGHT = 16;
// Beyond this many points the dots merge into the line and only add noise.
const MAX_MARKERS = 10;
// Smallest distance between gridlines that keeps their labels readable.
const MIN_TICK_GAP = 26;
// Candidate gridline steps, coarsest first. Hours run down to a single minute.
const HOUR_STEPS = [12, 6, 3, 2, 1, 0.5, 0.25, 1 / 6, 1 / 12, 1 / 60];
const PLAIN_STEPS = [1000, 500, 250, 100, 50, 25, 10, 5, 2, 1];

// Rounds the top of the scale up to something a person would pick, so the
// gridline labels stay readable.
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const steps = [1, 2, 2.5, 5, 10];
  for (const step of steps) {
    const candidate = step * magnitude;
    if (candidate >= value) return candidate;
  }
  return 10 * magnitude;
}

// The finest step that still leaves the gridlines far enough apart — this is
// what turns whole hours into half hours and then minutes as the plot grows.
function pickStep(steps: number[], max: number, plotHeight: number): number {
  let chosen = steps[0];
  for (const step of steps) {
    if ((step / max) * plotHeight < MIN_TICK_GAP) break;
    chosen = step;
  }
  return chosen;
}

function formatHours(value: number): string {
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
  const [width, setWidth] = useState(0);

  const count = labels.length;
  const max = niceMax(Math.max(...series.flatMap((item) => item.values), 0));
  const plotWidth = Math.max(0, width - PAD_LEFT - PAD_RIGHT);
  const viewport = height - AXIS_HEIGHT;
  const plotHeight = (viewport - PLOT_TOP - PLOT_BOTTOM) * zoom;
  const svgHeight = PLOT_TOP + plotHeight + PLOT_BOTTOM;
  const x = (index: number) =>
    count > 1 ? PAD_LEFT + (plotWidth * index) / (count - 1) : PAD_LEFT + plotWidth / 2;
  const y = (value: number) => PLOT_TOP + plotHeight * (1 - value / max);
  const labelStep = Math.ceil(count / 7);
  const showMarkers = count <= MAX_MARKERS;

  const step = pickStep(scale === 'hours' ? HOUR_STEPS : PLAIN_STEPS, max, plotHeight);
  const ticks = useMemo(() => {
    const values: number[] = [];
    for (let value = 0; value <= max + 1e-9; value += step) values.push(value);
    return values;
  }, [max, step]);

  // Panning writes straight to the shared value, so dragging never re-renders
  // the chart — only the transform is updated.
  const offset = useSharedValue(0);
  const bounds = useRef({ min: 0, max: 0 });
  const zoomRef = useRef(zoom);
  const zoomChangeRef = useRef(onZoomChange);
  // Drag and pinch each remember where they started; a finger landing or
  // lifting restarts the other one instead of jumping.
  const drag = useRef<{ offset: number; dy: number } | null>(null);
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  bounds.current = { min: Math.min(0, viewport - svgHeight), max: 0 };
  zoomRef.current = zoom;
  zoomChangeRef.current = onZoomChange;

  const previousPlot = useRef(plotHeight);
  useEffect(() => {
    // Keep whatever sits in the middle of the viewport in the middle of it.
    const ratio = previousPlot.current > 0 ? plotHeight / previousPlot.current : 1;
    previousPlot.current = plotHeight;
    const centred = (offset.value - viewport / 2) * ratio + viewport / 2;
    offset.value = Math.max(bounds.current.min, Math.min(bounds.current.max, centred));
  }, [plotHeight, viewport, offset]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        // Claim the touch outright: nothing inside the plot needs taps, and
        // leaving it to the ancestors is what made dragging unreliable.
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: (event) =>
          event.nativeEvent.touches.length > 1,
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
          const next = drag.current.offset + (gesture.dy - drag.current.dy);
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
      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        <View style={[styles.viewport, { height: viewport }]} {...responder.panHandlers}>
          <Animated.View style={panStyle}>
            {width > 0 && (
              <Svg width={width} height={svgHeight}>
                {ticks.map((tick) => (
                  <Line
                    key={tick}
                    x1={PAD_LEFT}
                    x2={PAD_LEFT + plotWidth}
                    y1={y(tick)}
                    y2={y(tick)}
                    stroke={theme.border}
                    strokeWidth={1}
                  />
                ))}
                {ticks.map((tick) => (
                  <SvgText
                    key={tick}
                    x={PAD_LEFT - 6}
                    y={y(tick) + 3}
                    fontSize={9}
                    fontFamily={NunitoSans.regular}
                    textAnchor="end"
                    fill={theme.textSecondary}>
                    {scale === 'hours' ? formatHours(tick) : String(Math.round(tick))}
                  </SvgText>
                ))}
                {series.map((item) => (
                  <Path
                    key={item.key}
                    d={item.values
                      .map((value, index) => `${index === 0 ? 'M' : 'L'}${x(index)} ${y(value)}`)
                      .join(' ')}
                    stroke={item.color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    fill="none"
                  />
                ))}
                {showMarkers &&
                  series.flatMap((item) =>
                    item.values.map((value, index) => (
                      <Circle
                        key={`${item.key}-${index}`}
                        cx={x(index)}
                        cy={y(value)}
                        r={4}
                        fill={item.color}
                        stroke={theme.background}
                        strokeWidth={2}
                      />
                    )),
                  )}
              </Svg>
            )}
          </Animated.View>
        </View>
        {width > 0 && (
          <Svg width={width} height={AXIS_HEIGHT}>
            {labels.map((label, index) =>
              index % labelStep === 0 ? (
                <SvgText
                  key={label + index}
                  x={x(index)}
                  y={11}
                  fontSize={9}
                  fontFamily={NunitoSans.regular}
                  textAnchor="middle"
                  fill={theme.textSecondary}>
                  {label}
                </SvgText>
              ) : null,
            )}
          </Svg>
        )}
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
  chart: {
    gap: Spacing.one,
  },
  viewport: {
    overflow: 'hidden',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
