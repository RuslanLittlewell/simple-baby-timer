import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import {
  BackMeridiansArtwork,
  CoreArtwork,
  FrontRingsArtwork,
  GlowArtwork,
  ShineArtwork,
} from "./artwork";
import {
  BASE_PALETTE,
  CORE_MIN_SCALE,
  LOADER_DURATION_MS,
  RING_MIN_SCALE,
  RING_ROTATION_DEG,
  SHIFTED_PALETTE,
  SHINE_MIN_SCALE,
  SWEEP_ROTATION_DEG,
  breathe,
  pulse,
} from "./helpers";
import { styles } from "./styles";

/** Both meridian cages spin and breathe together, half a turn per cycle. */
function useCageStyle(progress: SharedValue<number>) {
  return useAnimatedStyle(() => ({
    transform: [
      { rotate: `${progress.value * RING_ROTATION_DEG}deg` },
      { scale: breathe(progress.value, RING_MIN_SCALE) },
    ],
  }));
}

interface ActivitySyncIndicatorProps {
  accessibilityLabel: string;
}

export function ActivitySyncIndicator({
  accessibilityLabel,
}: ActivitySyncIndicatorProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: LOADER_DURATION_MS, easing: Easing.linear }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(progress);
      progress.value = 0;
    };
  }, [progress]);

  const backCageStyle = useCageStyle(progress);
  const frontCageStyle = useCageStyle(progress);
  const coreStyle = useAnimatedStyle(() => ({
    opacity: 1 - pulse(progress.value),
    transform: [{ scale: breathe(progress.value, CORE_MIN_SCALE) }],
  }));
  const shiftedCoreStyle = useAnimatedStyle(() => ({
    opacity: pulse(progress.value),
    transform: [{ scale: breathe(progress.value, CORE_MIN_SCALE) }],
  }));
  const shineStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${progress.value * SWEEP_ROTATION_DEG}deg` },
      { scale: breathe(progress.value, SHINE_MIN_SCALE) },
    ],
  }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: true }}
      pointerEvents="none"
      style={styles.canvas}
    >
      <Animated.View style={[styles.layer, backCageStyle]}>
        <BackMeridiansArtwork progress={progress} />
      </Animated.View>
      <View style={styles.layer}>
        <GlowArtwork />
      </View>
      <Animated.View style={[styles.layer, coreStyle]}>
        <CoreArtwork
          idPrefix="activitySyncBase"
          palette={BASE_PALETTE}
          progress={progress}
        />
      </Animated.View>
      {/* Cross-fading a hue-rotated twin stands in for the source's animated filter. */}
      <Animated.View style={[styles.layer, shiftedCoreStyle]}>
        <CoreArtwork
          idPrefix="activitySyncShifted"
          palette={SHIFTED_PALETTE}
          progress={progress}
        />
      </Animated.View>
      <Animated.View style={[styles.layer, shineStyle]}>
        <ShineArtwork />
      </Animated.View>
      <Animated.View style={[styles.layer, frontCageStyle]}>
        <FrontRingsArtwork progress={progress} />
      </Animated.View>
    </View>
  );
}
