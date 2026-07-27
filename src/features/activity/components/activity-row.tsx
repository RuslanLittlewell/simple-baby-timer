import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ACTIVITY_FG, ACTIVITY_GRADIENTS } from '@/constants/activities';
import { Spacing } from '@/constants/theme';

import { type GradKey, type IconName } from '../constants';

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
  const fg = ACTIVITY_FG[gradKey];
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

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <LinearGradient
        colors={ACTIVITY_GRADIENTS[gradKey]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.row, dimmed && styles.rowDimmed]}>
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
        <MaterialCommunityIcons name={icon} size={26} color={fg} />
        <ThemedText style={[styles.label, { color: fg }]} numberOfLines={1}>
          {label}
        </ThemedText>
        {isActive && onStop ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={(event) => {
              event.stopPropagation();
              onStop();
            }}>
            <MaterialCommunityIcons name="stop-circle" size={28} color={fg} />
          </Pressable>
        ) : (
          <MaterialCommunityIcons
            name={isActive ? 'stop-circle' : 'play-circle'}
            size={28}
            color={fg}
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
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.four,
    overflow: 'hidden',
  },
  rowDimmed: {
    opacity: 0.45,
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
