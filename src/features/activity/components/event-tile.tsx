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

import { CARD_HEIGHT, type GradKey, type IconName } from '../constants';

interface EventTileProps {
  icon: IconName;
  gradKey: GradKey;
  accessibilityLabel: string;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function EventTile({ icon, gradKey, accessibilityLabel, onPress }: EventTileProps) {
  const { gradients, fg } = useActivityColors();
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
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.wrap, animatedStyle]}>
      <LinearGradient
        colors={gradients[gradKey]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.tile}>
        <MaterialCommunityIcons name={icon} size={26} color={fg[gradKey]} />
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: CARD_HEIGHT,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
});
