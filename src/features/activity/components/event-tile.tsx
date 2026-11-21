import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useActivityColors } from '@/hooks/use-activity-colors';

import { ACTION_RADIUS, CARD_HEIGHT, type GradKey, type IconName } from '../constants';
import { ActivityIcon } from './activity-icon';

interface EventTileProps {
  icon: IconName;
  gradKey: GradKey;
  accessibilityLabel: string;
  disabled?: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function EventTile({
  icon,
  gradKey,
  accessibilityLabel,
  disabled = false,
  onPress,
}: EventTileProps) {
  const { surfaces } = useActivityColors();
  const surface = surfaces[gradKey];
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.94, { duration: 90 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 260, mass: 0.45 });
  };

  return (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.tile,
        { backgroundColor: surface.fill, borderColor: surface.border },
        disabled && styles.disabled,
        animatedStyle,
      ]}>
      {surface.gradient && (
        <LinearGradient
          colors={surface.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <ActivityIcon name={icon} size={30} color={surface.icon} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: CARD_HEIGHT,
    borderRadius: ACTION_RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.45,
  },
});
