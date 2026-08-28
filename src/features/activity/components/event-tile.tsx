import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import { useActivityColors } from '@/hooks/use-activity-colors';

import { CARD_HEIGHT, COMPACT_CARD_HEIGHT, DENSE_CARD_HEIGHT, type GradKey, type IconName } from '../constants';
import { useCompactActivityLayout, useDenseActivityLayout } from '../use-compact-activity-layout';

const withAlpha = (hex: string, alpha: number) => {
  const value = hex.replace('#', '');
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
};

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
  const { gradients, fg, accent } = useActivityColors();
  const compact = useCompactActivityLayout();
  const dense = useDenseActivityLayout();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.9, { duration: 90 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 8, stiffness: 260, mass: 0.45 });
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
      style={[styles.wrap, disabled && styles.disabled, animatedStyle]}>
      <LinearGradient
        colors={gradients[gradKey]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.tile,
          {
            borderColor:
              gradKey === 'diaper'
                ? 'rgba(105,112,124,0.82)'
                : withAlpha(accent[gradKey], 0.68),
          },
          compact && styles.tileCompact,
          dense && styles.tileDense,
        ]}>
        <MaterialCommunityIcons
          name={icon}
          size={dense ? 22 : compact ? 24 : 26}
          color={fg[gradKey]}
        />
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  disabled: {
    opacity: 0.45,
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: CARD_HEIGHT,
    paddingVertical: Spacing.four,
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
  },
  tileCompact: {
    minHeight: COMPACT_CARD_HEIGHT,
    paddingVertical: Spacing.three,
  },
  tileDense: {
    minHeight: DENSE_CARD_HEIGHT,
    paddingVertical: Spacing.two,
    borderRadius: 20,
  },
});
