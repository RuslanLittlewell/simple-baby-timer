import { useIsFocused } from "expo-router/react-navigation";
import { useState, type ReactNode } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

import { useTheme } from "@/hooks/use-theme";
import { useAppStore } from "@/state/app-state";

interface StatusIllustrationProps {
  night: boolean;
  active: boolean;
}

interface LayerProps {
  width: number;
  height: number;
  children: ReactNode;
}

const VIEW_WIDTH = 180;
const VIEW_HEIGHT = 132;
const MIN_VISIBLE_WIDTH = 84;
const SUN = { x: 110, y: 86, r: 27 };
const ORBIT_RADIUS = 66;
const RAY_ANGLES = [18, 42, 66, 90, 114, 138, 162];

const PALETTE = {
  dark: {
    orbit: "#B9A6EC",
    orbitDot: "#CDB9FF",
    cloudBackTop: "#B49BE6",
    cloudBackBottom: "#7A62B4",
    cloudFront: "#56457F",
    star: "#E7DEFF",
  },
  light: {
    orbit: "#8D77D2",
    orbitDot: "#8D77D2",
    cloudBackTop: "#D6C9F4",
    cloudBackBottom: "#B5A2E6",
    cloudFront: "#A08BD8",
    star: "#8D77D2",
  },
} as const;

const point = (angle: number, radius: number) => {
  const radians = (angle * Math.PI) / 180;
  return {
    x: SUN.x + radius * Math.cos(radians),
    y: SUN.y - radius * Math.sin(radians),
  };
};

const orbitStart = point(168, ORBIT_RADIUS);
const orbitEnd = point(8, ORBIT_RADIUS);
const orbitDot = point(36, ORBIT_RADIUS);

const swing = (from: number, to: number, duration: number) => {
  "worklet";
  const easing = Easing.inOut(Easing.sin);
  return withSequence(
    withTiming(from, { duration: duration / 2, easing }),
    withRepeat(withTiming(to, { duration, easing }), -1, true),
  );
};

const swingDeg = (from: number, to: number, duration: number) => {
  "worklet";
  const easing = Easing.inOut(Easing.sin);
  return withSequence(
    withTiming(`${from}deg`, { duration: duration / 2, easing }),
    withRepeat(withTiming(`${to}deg`, { duration, easing }), -1, true),
  );
};

function Layer({ width, height, children }: LayerProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="xMaxYMax meet"
    >
      {children}
    </Svg>
  );
}

export function StatusIllustration({ night, active }: StatusIllustrationProps) {
  const theme = useTheme();
  const mode = useAppStore((state) => state.themeMode);
  const focused = useIsFocused();
  const reduceMotion = useReducedMotion();
  const colors = PALETTE[mode];
  const [size, setSize] = useState({ width: 0, height: 0 });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((current) =>
      current.width === width && current.height === height ? current : { width, height },
    );
  };

  const animate = active && focused && !reduceMotion;
  const scale = Math.min(size.width / VIEW_WIDTH, size.height / VIEW_HEIGHT);
  const sunOrigin = {
    transformOrigin: [
      size.width - (VIEW_WIDTH - SUN.x) * scale,
      size.height - (VIEW_HEIGHT - SUN.y) * scale,
      0,
    ] as [number, number, number],
  };

  const orbitDotStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: animate ? swingDeg(0, -40, 9000) : withTiming("0deg") }],
  }));
  const raysStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: animate ? swingDeg(-8, 8, 4200) : withTiming("0deg") },
      { scale: animate ? swing(1, 1.06, 2600) : withTiming(1) },
    ],
  }));
  const sunStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animate ? swing(1, 1.05, 2600) : withTiming(1) }],
  }));
  const moonStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: animate ? swing(0, -4, 3200) : withTiming(0) }],
  }));
  const starsStyle = useAnimatedStyle(() => ({
    opacity: animate ? swing(1, 0.3, 1800) : withTiming(1),
  }));
  const cloudsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: animate ? swing(0, -5, 5200) : withTiming(0) }],
  }));

  const visible = size.width >= MIN_VISIBLE_WIDTH && size.height > 0;
  const { width, height } = size;

  return (
    <View
      style={styles.slot}
      onLayout={handleLayout}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {visible && (
        <>
          <View style={StyleSheet.absoluteFill}>
            <Layer width={width} height={height}>
              <Path
                d={`M ${orbitStart.x} ${orbitStart.y} A ${ORBIT_RADIUS} ${ORBIT_RADIUS} 0 0 1 ${orbitEnd.x} ${orbitEnd.y}`}
                stroke={colors.orbit}
                strokeOpacity={0.55}
                strokeWidth={1.5}
                fill="none"
              />
            </Layer>
          </View>

          <Animated.View style={[StyleSheet.absoluteFill, sunOrigin, orbitDotStyle]}>
            <Layer width={width} height={height}>
              <Circle cx={orbitDot.x} cy={orbitDot.y} r={5} fill={colors.orbitDot} />
            </Layer>
          </Animated.View>

          {night ? (
            <>
              <Animated.View style={[StyleSheet.absoluteFill, starsStyle]}>
                <Layer width={width} height={height}>
                  <Circle cx={44} cy={34} r={1.6} fill={colors.star} opacity={0.7} />
                  <Circle cx={70} cy={20} r={1.2} fill={colors.star} opacity={0.6} />
                  <Circle cx={150} cy={30} r={1.4} fill={colors.star} opacity={0.6} />
                </Layer>
              </Animated.View>
              <Animated.View style={[StyleSheet.absoluteFill, sunOrigin, moonStyle]}>
                <Layer width={width} height={height}>
                  <Defs>
                    <RadialGradient id="moon" cx="40%" cy="35%" r="70%">
                      <Stop offset="0" stopColor="#FFF1C2" />
                      <Stop offset="1" stopColor="#E9C76E" />
                    </RadialGradient>
                  </Defs>
                  <Circle cx={SUN.x} cy={SUN.y} r={SUN.r} fill="url(#moon)" />
                  <Circle cx={SUN.x + 13} cy={SUN.y - 9} r={SUN.r - 3} fill={theme.statusCard} />
                </Layer>
              </Animated.View>
            </>
          ) : (
            <>
              <Animated.View style={[StyleSheet.absoluteFill, sunOrigin, raysStyle]}>
                <Layer width={width} height={height}>
                  {RAY_ANGLES.map((angle) => {
                    const from = point(angle, SUN.r + 9);
                    const to = point(angle, SUN.r + 19);
                    return (
                      <Line
                        key={angle}
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke="#F6C453"
                        strokeWidth={4.5}
                        strokeLinecap="round"
                      />
                    );
                  })}
                </Layer>
              </Animated.View>
              <Animated.View style={[StyleSheet.absoluteFill, sunOrigin, sunStyle]}>
                <Layer width={width} height={height}>
                  <Defs>
                    <RadialGradient id="sun" cx="45%" cy="40%" r="65%">
                      <Stop offset="0" stopColor="#FFE7A6" />
                      <Stop offset="0.6" stopColor="#F9C75C" />
                      <Stop offset="1" stopColor="#EFA93C" />
                    </RadialGradient>
                  </Defs>
                  <Circle cx={SUN.x} cy={SUN.y} r={SUN.r} fill="url(#sun)" />
                </Layer>
              </Animated.View>
            </>
          )}

          <Animated.View style={[StyleSheet.absoluteFill, cloudsStyle]}>
            <Layer width={width} height={height}>
              <Defs>
                <LinearGradient id="cloud" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.cloudBackTop} />
                  <Stop offset="1" stopColor={colors.cloudBackBottom} />
                </LinearGradient>
              </Defs>
              <G fill="url(#cloud)">
                <Circle cx={64} cy={118} r={20} />
                <Circle cx={92} cy={104} r={24} />
                <Circle cx={124} cy={106} r={22} />
                <Circle cx={152} cy={113} r={20} />
                <Circle cx={178} cy={118} r={18} />
                <Rect x={64} y={114} width={140} height={30} />
              </G>
              <G fill={colors.cloudFront}>
                <Circle cx={30} cy={130} r={14} />
                <Circle cx={54} cy={124} r={18} />
                <Circle cx={82} cy={128} r={16} />
                <Rect x={30} y={126} width={60} height={20} />
              </G>
            </Layer>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 104,
    alignSelf: "stretch",
  },
});
