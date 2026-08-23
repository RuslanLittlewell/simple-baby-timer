import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { type IconName } from '../constants';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface StreakSpec {
  id: string;
  size: number;
  left: number;
  travelY: number;
  duration: number;
  
  
  phase: number;
  opacity: number;
}

const START_TOP = -60;




const BASE_LANES: Omit<StreakSpec, 'id' | 'phase'>[] = [
  { size: 26, left: SCREEN_W * 0.08, travelY: SCREEN_H - START_TOP + 60, duration: 9000, opacity: 0.22 },
  { size: 34, left: SCREEN_W * 0.28, travelY: SCREEN_H - START_TOP + 60, duration: 12000, opacity: 0.16 },
  { size: 20, left: SCREEN_W * 0.5, travelY: SCREEN_H - START_TOP + 60, duration: 7500, opacity: 0.26 },
  { size: 30, left: SCREEN_W * 0.72, travelY: SCREEN_H - START_TOP + 60, duration: 10500, opacity: 0.18 },
  { size: 24, left: SCREEN_W * 0.92, travelY: SCREEN_H - START_TOP + 60, duration: 8800, opacity: 0.2 },
];

const WAVES_PER_LANE = 3;
const WAVE_DELAY = 2600;
const LANE_DELAY = 1800;

const STREAKS: StreakSpec[] = BASE_LANES.flatMap((lane, laneIndex) =>
  Array.from({ length: WAVES_PER_LANE }, (_, wave) => ({
    ...lane,
    id: `s${laneIndex}-${wave}`,
    left: lane.left + (wave - 1) * SCREEN_W * 0.06,
    size: lane.size + (wave - 1) * 3,
    phase: ((laneIndex * LANE_DELAY + wave * WAVE_DELAY) % lane.duration) / lane.duration,
  })),
);

interface FloatingIconProps {
  spec: StreakSpec;
  icon: IconName;
  color: string;
}

function FloatingIcon({ spec, icon, color }: FloatingIconProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: spec.duration, easing: Easing.linear }),
      -1,
      false,
    );
  }, [progress, spec.duration]);

  const style = useAnimatedStyle(() => {
    const position = (progress.value + spec.phase) % 1;
    const edge = 0.08;
    const fade =
      position < edge ? position / edge : position > 1 - edge ? (1 - position) / edge : 1;
    return {
      opacity: spec.opacity * fade,
      transform: [{ translateY: position * spec.travelY }],
    };
  });

  return (
    <Animated.View style={[styles.icon, { top: START_TOP, left: spec.left }, style]}>
      <MaterialCommunityIcons name={icon} size={spec.size} color={color} />
    </Animated.View>
  );
}

export interface FloatingIconKind {
  icon: IconName;
  color: string;
}

interface FloatingIconsProps {
  kinds: FloatingIconKind[];
}

export function FloatingIcons({ kinds }: FloatingIconsProps) {
  if (!kinds.length) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {STREAKS.map((spec, index) => {
        const kind = kinds[index % kinds.length];
        return <FloatingIcon key={spec.id} spec={spec} icon={kind.icon} color={kind.color} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    position: 'absolute',
  },
});
