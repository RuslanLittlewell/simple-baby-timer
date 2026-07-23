import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ACTIVITY_ACCENT, ACTIVITY_FG, ACTIVITY_GRADIENTS } from '@/constants/activities';
import { Spacing } from '@/constants/theme';
import { type ActivitySession } from '@/lib/activity-store';
import { type ActivityKind } from '@/lib/notifications';

import {
  KIND_META,
  LANES,
  MIN_EVENT_HEIGHT,
  SCREEN_WIDTH,
  STRIPE_PITCH,
  STRIPE_SKEW,
  STRIPE_THICKNESS,
} from '../constants';
import { fmtTime, isEvent, laneLeft, type Translate } from '../helpers';

interface TimelineBlocksProps {
  sessions: ActivitySession[];
  hourHeight: number;
  dayStartMs: number;
  onEdit: (entry: ActivitySession) => void;
  t: Translate;
}

export const TimelineBlocks = memo(function TimelineBlocks({
  sessions,
  hourHeight,
  dayStartMs,
  onEdit,
  t,
}: TimelineBlocksProps) {
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

export interface LiveBlock {
  kind: ActivityKind;
  start: number;
  top: number;
  height: number;
}

interface LiveBlocksProps {
  blocks: LiveBlock[];
  t: Translate;
}

export function LiveBlocks({ blocks, t }: LiveBlocksProps) {
  return (
    <>
      {blocks.map((block) => {
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
                  <ThemedText style={[styles.blockTitle, { color: fg }]} numberOfLines={1}>
                    {t(`kind.${block.kind}`)}
                  </ThemedText>
                </View>
                {block.height >= 34 && (
                  <ThemedText style={[styles.blockTime, { color: fg }]} numberOfLines={1}>
                    {fmtTime(block.start)}–{t('calendar.now')}
                  </ThemedText>
                )}
              </View>
            )}
          </LinearGradient>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
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
  pressed: {
    opacity: 0.5,
  },
});
