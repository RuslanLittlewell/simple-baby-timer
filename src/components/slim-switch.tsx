import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

interface SlimSwitchProps {
  value: boolean;
  label: string;
  labelColor: string;
  activeColor: string;
  inactiveColor: string;
  onValueChange: (value: boolean) => void;
}

const TRACK_WIDTH = 34;
const TRACK_HEIGHT = 20;
const THUMB_SIZE = 16;
const THUMB_INSET = (TRACK_HEIGHT - THUMB_SIZE) / 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_INSET * 2;
const DURATION = 160;

export function SlimSwitch({
  value,
  label,
  labelColor,
  activeColor,
  inactiveColor,
  onValueChange,
}: SlimSwitchProps) {
  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(value ? activeColor : inactiveColor, { duration: DURATION }),
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(value ? THUMB_TRAVEL : 0, { duration: DURATION }) }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={{ top: 12, bottom: 12 }}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <ThemedText numberOfLines={1} style={[styles.label, { color: labelColor }]}>
        {label}
      </ThemedText>
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 24,
  },
  label: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: THUMB_INSET,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
  },
  pressed: {
    opacity: 0.7,
  },
});
