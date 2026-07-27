import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/state/app-state';

import {
  AWAKE_FILL_GRADIENT,
  AWAKE_FILL_ICON,
  GUTTER,
  HOUR_HEIGHT,
  KIND_STYLE,
  MIN_BLOCK_HEIGHT,
  POINT_HEIGHT,
} from '../constants';
import { awakeFills, formatMin, windowForVariant } from '../helpers';
import { type RegimeStep, type RegimeVariant } from '../types';

const pad2 = (n: number) => String(n).padStart(2, '0');

interface RegimeTimelineProps {
  variant: RegimeVariant;
  onSelect: (step: RegimeStep) => void;
}

export function RegimeTimeline({ variant, onSelect }: RegimeTimelineProps) {
  const theme = useTheme();
  const t = useT();
  const { startHour, endHour } = windowForVariant(variant);
  const winStart = startHour * 60;
  const winEnd = endHour * 60;
  const height = (endHour - startHour) * HOUR_HEIGHT;
  const y = (min: number) => ((min - winStart) / 60) * HOUR_HEIGHT;

  const sleeps = variant.steps.filter((s) => s.kind === 'sleep' && s.startMin !== null);
  // Everything that happens during awake time (feedings, meals, rituals,
  // activities, wake-ups) is overlaid on the awake fill.
  const overlays = variant.steps.filter((s) => s.kind !== 'sleep' && s.startMin !== null);

  const fills: RegimeStep[] = awakeFills(variant, winStart, winEnd).map((f) => ({
    time: `${formatMin(f.startMin)}–${formatMin(f.endMin)}`,
    startMin: f.startMin,
    endMin: f.endMin,
    action: t('regimes.anyActivity'),
    note: t('regimes.anyActivityNote'),
    kind: 'wake',
  }));

  const renderFullBlock = (step: RegimeStep, key: string) => {
    const style = KIND_STYLE[step.kind];
    const top = y(step.startMin!);
    const blockHeight = Math.max(MIN_BLOCK_HEIGHT, y(step.endMin!) - top);
    return (
      <Pressable
        key={key}
        accessibilityLabel={step.action}
        onPress={() => onSelect(step)}
        style={({ pressed }) => [styles.block, { top, height: blockHeight }, pressed && styles.pressed]}>
        <LinearGradient
          colors={style.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.blockFill}>
          <View style={styles.blockRow}>
            <MaterialCommunityIcons name={style.icon} size={15} color={style.fg} />
            <ThemedText style={[styles.blockTitle, { color: style.fg }]} numberOfLines={1}>
              {step.action}
            </ThemedText>
            <MaterialCommunityIcons name="information-outline" size={15} color={style.fg} />
          </View>
          {blockHeight >= 40 && (
            <ThemedText style={[styles.blockTime, { color: style.fg }]}>
              {formatMin(step.startMin!)}–{formatMin(step.endMin!)}
            </ThemedText>
          )}
        </LinearGradient>
      </Pressable>
    );
  };

  // Awake window base — yellow-lime block with only a sun icon; feeding and
  // activity chips overlay it.
  const renderFill = (step: RegimeStep, key: string) => {
    const top = y(step.startMin!);
    const blockHeight = Math.max(MIN_BLOCK_HEIGHT, y(step.endMin!) - top);
    return (
      <Pressable
        key={key}
        accessibilityLabel={step.action}
        onPress={() => onSelect(step)}
        style={({ pressed }) => [styles.fill, { top, height: blockHeight }, pressed && styles.pressed]}>
        <LinearGradient
          colors={AWAKE_FILL_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fillGradient}>
          <MaterialCommunityIcons name="white-balance-sunny" size={20} color={AWAKE_FILL_ICON} />
        </LinearGradient>
      </Pressable>
    );
  };

  const renderOverlay = (step: RegimeStep, key: string) => {
    const style = KIND_STYLE[step.kind];
    const isRange = step.endMin !== null;
    const chipHeight = isRange
      ? Math.max(POINT_HEIGHT, y(step.endMin!) - y(step.startMin!))
      : POINT_HEIGHT;
    const rawTop = isRange ? y(step.startMin!) : y(step.startMin!) - POINT_HEIGHT / 2;
    const top = Math.max(0, Math.min(height - chipHeight, rawTop));
    return (
      <Pressable
        key={key}
        accessibilityLabel={step.action}
        onPress={() => onSelect(step)}
        style={({ pressed }) => [styles.overlay, { top, height: chipHeight }, pressed && styles.pressed]}>
        <LinearGradient
          colors={style.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.overlayFill}>
          <MaterialCommunityIcons name={style.icon} size={14} color={style.fg} />
          <ThemedText style={[styles.overlayLabel, { color: style.fg }]} numberOfLines={1}>
            {step.action}
          </ThemedText>
          <ThemedText style={[styles.overlayTime, { color: style.fg }]}>
            {formatMin(step.startMin!)}
          </ThemedText>
          <MaterialCommunityIcons name="information-outline" size={13} color={style.fg} />
        </LinearGradient>
      </Pressable>
    );
  };

  return (
    <View style={[styles.timeline, { height }]}>
      {Array.from({ length: endHour - startHour + 1 }).map((_, i) => (
        <View key={`h-${i}`} pointerEvents="none">
          <View
            style={[styles.hourLine, { top: i * HOUR_HEIGHT, backgroundColor: theme.backgroundSelected }]}
          />
          <View style={[styles.hourLabel, { top: i * HOUR_HEIGHT - 8 }]}>
            <ThemedText style={styles.hourNum}>{pad2(startHour + i)}</ThemedText>
            <ThemedText style={styles.hourSup} themeColor="textSecondary">
              00
            </ThemedText>
          </View>
        </View>
      ))}

      {fills.map((step, i) => renderFill(step, `fill-${i}`))}
      {sleeps.map((step, i) => renderFullBlock(step, `sleep-${i}`))}
      {overlays.map((step, i) => renderOverlay(step, `ov-${i}`))}
    </View>
  );
}

const styles = StyleSheet.create({
  timeline: {
    position: 'relative',
    marginTop: Spacing.two,
  },
  hourLine: {
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
  block: {
    position: 'absolute',
    left: GUTTER,
    right: Spacing.two,
    borderRadius: 8,
    overflow: 'hidden',
  },
  blockFill: {
    flex: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  blockTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  blockTime: {
    fontSize: 11,
    marginTop: 1,
    opacity: 0.85,
  },
  fill: {
    position: 'absolute',
    left: GUTTER,
    right: Spacing.two,
    borderRadius: 8,
    overflow: 'hidden',
  },
  fillGradient: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  // Feeding / activity chips overlaid on the awake fill, anchored right so the
  // "any activity" label underneath stays visible on the left.
  overlay: {
    position: 'absolute',
    left: '45%',
    right: Spacing.two,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.15)',
    overflow: 'hidden',
  },
  overlayFill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  overlayLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  overlayTime: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    opacity: 0.85,
  },
  pressed: {
    opacity: 0.6,
  },
});
