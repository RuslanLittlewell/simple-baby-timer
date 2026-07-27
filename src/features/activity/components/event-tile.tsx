import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ACTIVITY_FG, ACTIVITY_GRADIENTS } from '@/constants/activities';
import { Spacing } from '@/constants/theme';

import { type GradKey, type IconName } from '../constants';

interface EventTileProps {
  icon: IconName;
  gradKey: GradKey;
  accessibilityLabel: string;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function EventTile({ icon, gradKey, accessibilityLabel, onPress }: EventTileProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.9, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 8, stiffness: 260, mass: 0.45 });
      }}
      style={[styles.wrap, animatedStyle]}>
      <LinearGradient
        colors={ACTIVITY_GRADIENTS[gradKey]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.tile}>
        <MaterialCommunityIcons name={icon} size={26} color={ACTIVITY_FG[gradKey]} />
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
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
});
