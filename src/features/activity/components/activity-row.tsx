import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { type GestureResponderEvent, Pressable, StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useActivityColors } from '@/hooks/use-activity-colors';

import { CARD_HEIGHT, COMPACT_CARD_HEIGHT, DENSE_CARD_HEIGHT, type GradKey, type IconName } from '../constants';
import { useCompactActivityLayout, useDenseActivityLayout } from '../use-compact-activity-layout';
import { TimerToggleIcon } from './timer-toggle-icon';

interface ActivityRowProps {
  icon: IconName;
  gradKey: GradKey;
  label: string;
  isActive: boolean;
  dimmed?: boolean;
  onPress: () => void;
  onStop?: () => void;
}

export function ActivityRow({
  icon,
  gradKey,
  label,
  isActive,
  dimmed,
  onPress,
  onStop,
}: ActivityRowProps) {
  const { gradients, fg: fgColors, accent: accentColors } = useActivityColors();
  const fg = fgColors[gradKey];
  const accent = accentColors[gradKey];
  const compact = useCompactActivityLayout();
  const dense = useDenseActivityLayout();
  const sheenX = useSharedValue(-140);

  useEffect(() => {
    cancelAnimation(sheenX);
    if (isActive) {
      sheenX.value = -140;
      sheenX.value = withRepeat(
        withTiming(900, { duration: 3200, easing: Easing.inOut(Easing.quad) }),
        -1,
        false,
      );
    } else {
      sheenX.value = -140;
    }
  }, [isActive, sheenX]);

  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sheenX.value }, { skewX: '-16deg' }],
  }));

  const handleStopPress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onStop?.();
  };

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <LinearGradient
        colors={gradients[gradKey]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.row, compact && styles.rowCompact, dense && styles.rowDense, dimmed && styles.rowDimmed]}>
        {isActive && (
          <Animated.View pointerEvents="none" style={[styles.sheen, sheenStyle]}>
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
        <MaterialCommunityIcons name={icon} size={dense ? 22 : compact ? 24 : 26} color={accent} />
        <ThemedText style={[styles.label, { color: fg }]} numberOfLines={1}>
          {label}
        </ThemedText>
        {isActive && onStop ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={handleStopPress}>
            <TimerToggleIcon
              active
              accent={accent}
              darkBackgroundColor={gradKey === 'feed' ? fg : undefined}
            />
          </Pressable>
        ) : (
          <TimerToggleIcon
            active={isActive}
            accent={accent}
            darkBackgroundColor={gradKey === 'feed' ? fg : undefined}
          />
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: CARD_HEIGHT,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.four,
    overflow: 'hidden',
  },
  rowDimmed: {
    opacity: 0.45,
  },
  rowCompact: {
    minHeight: COMPACT_CARD_HEIGHT,
    paddingVertical: Spacing.three,
  },
  rowDense: {
    minHeight: DENSE_CARD_HEIGHT,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 132,
  },
});
