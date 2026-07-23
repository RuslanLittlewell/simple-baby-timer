import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface BlobSpec {
  id: string;
  color: string;
  size: number;
  top: number;
  left: number;
  driftX: number;
  driftY: number;
  duration: number;
}

// голубой / синий / розовый / фиолетовый
const BLOBS: BlobSpec[] = [
  {
    id: 'sky',
    color: '#6FCBFF',
    size: 380,
    top: -90,
    left: -110,
    driftX: 70,
    driftY: 50,
    duration: 9000,
  },
  {
    id: 'blue',
    color: '#2A5CC8',
    size: 480,
    top: SCREEN_H * 0.18,
    left: SCREEN_W - 240,
    driftX: -80,
    driftY: 70,
    duration: 12000,
  },
  {
    id: 'pink',
    color: '#F27BA5',
    size: 420,
    top: SCREEN_H * 0.52,
    left: -150,
    driftX: 90,
    driftY: -60,
    duration: 11000,
  },
  {
    id: 'violet',
    color: '#8E5CF0',
    size: 460,
    top: SCREEN_H * 0.68,
    left: SCREEN_W - 280,
    driftX: -70,
    driftY: -80,
    duration: 10000,
  },
];

interface AuroraBlobProps {
  spec: BlobSpec;
}

function AuroraBlob({ spec }: AuroraBlobProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: spec.duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [progress, spec.duration]);

  const drift = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * spec.driftX },
      { translateY: progress.value * spec.driftY },
      { scale: 1 + progress.value * 0.22 },
    ],
  }));

  return (
    <Animated.View
      style={[styles.blob, { top: spec.top, left: spec.left, width: spec.size, height: spec.size }, drift]}>
      <Svg width={spec.size} height={spec.size}>
        <Defs>
          <RadialGradient id={`aurora-${spec.id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={spec.color} stopOpacity={0.45} />
            <Stop offset="60%" stopColor={spec.color} stopOpacity={0.18} />
            <Stop offset="100%" stopColor={spec.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle
          cx={spec.size / 2}
          cy={spec.size / 2}
          r={spec.size / 2}
          fill={`url(#aurora-${spec.id})`}
        />
      </Svg>
    </Animated.View>
  );
}

export function AuroraBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {BLOBS.map((spec) => (
        <AuroraBlob key={spec.id} spec={spec} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
  },
});
