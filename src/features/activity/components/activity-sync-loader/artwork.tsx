import type { ComponentType, ReactNode } from "react";
import Animated, {
  useAnimatedProps,
  type SharedValue,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Mask,
  Path,
  RadialGradient,
  Stop,
  type GProps,
} from "react-native-svg";

import {
  BLOB_ROTATION_RANGE,
  FLARE_MAX_OPACITY,
  LOADER_HEIGHT,
  LOADER_VIEW_BOX,
  LOADER_WIDTH,
  RING_ROTATION_DEG,
  meridianPath,
  meridianPhase,
  pulse,
  rotationMatrix,
  type LoaderPalette,
} from "./helpers";

/**
 * `matrix` is a real native prop on RNSVGGroup — it is how react-native-svg
 * delivers every transform — but it is missing from the public `GProps`, so it
 * has to be reintroduced before Reanimated can drive it from the UI thread.
 */
interface GroupMatrixProps {
  matrix: number[];
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(
  G as unknown as ComponentType<GProps & Partial<GroupMatrixProps>>,
);

const MERIDIAN_TILT_DEG = -30;

interface LoaderCanvasProps {
  children: ReactNode;
}

function LoaderCanvas({ children }: LoaderCanvasProps) {
  return (
    <Svg
      width={LOADER_WIDTH}
      height={LOADER_HEIGHT}
      viewBox={LOADER_VIEW_BOX}
      fill="none"
    >
      {children}
    </Svg>
  );
}

interface MeridianArtworkProps {
  progress: SharedValue<number>;
}

/**
 * The pair of meridians that pass *behind* the orb: they start as the upper
 * half of the cage, flatten into a line, then bulge out as the lower half.
 */
export function BackMeridiansArtwork({ progress }: MeridianArtworkProps) {
  const arc = useAnimatedProps(() => ({
    d: meridianPath(meridianPhase(progress.value)),
  }));

  return (
    <LoaderCanvas>
      <G opacity={0.5}>
        <AnimatedPath
          animatedProps={arc}
          fill="none"
          opacity={0.5}
          stroke="#FFFFFF"
          strokeWidth={2}
        />
        <G rotation={MERIDIAN_TILT_DEG}>
          <AnimatedPath
            animatedProps={arc}
            fill="none"
            opacity={0.5}
            stroke="#FFFFFF"
            strokeWidth={2}
          />
        </G>
      </G>
    </LoaderCanvas>
  );
}

/** The two static halos sitting between the back cage and the orb. */
export function GlowArtwork() {
  return (
    <LoaderCanvas>
      <Defs>
        <RadialGradient id="activitySyncHaloPink" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FA01FC" stopOpacity={1} />
          <Stop offset="1" stopColor="#FA01FC" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="activitySyncHaloBlue" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#0054FF" stopOpacity={1} />
          <Stop offset="1" stopColor="#0054FF" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse
        cx={134.256884}
        cy={-96.72358}
        rx={151}
        ry={151}
        fill="url(#activitySyncHaloPink)"
        opacity={0.25}
      />
      <Ellipse
        cx={-142.916008}
        cy={49}
        rx={151}
        ry={151}
        fill="url(#activitySyncHaloBlue)"
        opacity={0.38}
      />
    </LoaderCanvas>
  );
}

interface CoreArtworkProps {
  idPrefix: string;
  palette: LoaderPalette;
  progress: SharedValue<number>;
}

/**
 * The orb: a blue-to-red disc under a pink glow, a white flare and a drifting
 * violet cloud, cut out by a lobed silhouette rather than a plain circle.
 */
export function CoreArtwork({ idPrefix, palette, progress }: CoreArtworkProps) {
  const cloud = useAnimatedProps<GroupMatrixProps>(() => {
    const [from, to] = BLOB_ROTATION_RANGE;
    return {
      matrix: rotationMatrix(from + (to - from) * pulse(progress.value)),
    };
  });
  const flare = useAnimatedProps(() => ({
    opacity: FLARE_MAX_OPACITY * (1 - pulse(progress.value)),
  }));

  return (
    <LoaderCanvas>
      <Defs>
        <LinearGradient id={`${idPrefix}Core`} x1="0" y1="0.5" x2="1" y2="0.5">
          <Stop offset="0" stopColor={palette.coreFrom} />
          <Stop offset="1" stopColor={palette.coreTo} />
        </LinearGradient>
        <RadialGradient id={`${idPrefix}Glow`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={palette.glow} stopOpacity={1} />
          <Stop offset="1" stopColor={palette.coreTo} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient
          id={`${idPrefix}Violet`}
          x1="0.218881"
          y1="0.921618"
          x2="0.575964"
          y2="0.269703"
        >
          <Stop offset="0" stopColor="#000000" />
          <Stop offset="1" stopColor={palette.violet} />
        </LinearGradient>
        <RadialGradient id={`${idPrefix}Flare`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
        {/* Keeps the blue-to-red disc off the middle so it only reads at the rim. */}
        <RadialGradient
          id={`${idPrefix}VignetteFill`}
          cx="93.5%"
          cy="50%"
          rx="61.6%"
          ry="76.3%"
        >
          <Stop offset="0.24" stopColor="#000000" />
          <Stop offset="1" stopColor="#FFFFFF" />
        </RadialGradient>
        <Mask
          id={`${idPrefix}Vignette`}
          maskUnits="userSpaceOnUse"
          x={-200}
          y={-200}
          width={400}
          height={400}
        >
          <Circle r={168.09308} fill={`url(#${idPrefix}VignetteFill)`} />
        </Mask>
        {/* Four overlapping discs, so the rim is lobed instead of perfectly round. */}
        <Mask
          id={`${idPrefix}Silhouette`}
          maskUnits="userSpaceOnUse"
          x={-200}
          y={-200}
          width={400}
          height={400}
        >
          <Circle r={143.776898} fill="#FFFFFF" />
          <Ellipse rx={164.024} ry={144.252} fill="#FFFFFF" opacity={0.38} />
          <Ellipse
            rx={156.526}
            ry={148.072}
            rotation={45}
            fill="#FFFFFF"
            opacity={0.38}
          />
          <Ellipse
            rx={156.526}
            ry={148.072}
            rotation={90}
            fill="#FFFFFF"
            opacity={0.38}
          />
        </Mask>
      </Defs>
      <G mask={`url(#${idPrefix}Silhouette)`}>
        <Circle r={189} fill="#000000" opacity={0.8} />
        <G mask={`url(#${idPrefix}Vignette)`}>
          <Circle r={168.09308} fill={`url(#${idPrefix}Core)`} />
        </G>
        <Circle cy={-140} r={189} fill={`url(#${idPrefix}Glow)`} />
        <AnimatedCircle
          animatedProps={flare}
          cy={-60}
          r={189}
          fill={`url(#${idPrefix}Flare)`}
        />
        <AnimatedG animatedProps={cloud}>
          <Path
            d="M-280 64C-220 22-145 70-112 137C-79 204-38 250 55 263C-15 330-154 333-237 251C-305 183-306 102-280 64Z"
            fill={`url(#${idPrefix}Violet)`}
            opacity={0.38}
          />
          <Path
            d="M-242-10C-234 55-154 92-90 97C-8 103 49 85 99 152C72 396-178 436-288 332C-399 228-312 32-242-10Z"
            transform="translate(115 -166)"
            fill={`url(#${idPrefix}Violet)`}
            opacity={0.349273}
          />
          <Path
            d="M-292 82C-242 68-174 130-142 168C-102 213-64 246 6 272C-40 360-189 370-263 296C-338 222-314 116-292 82Z"
            transform="translate(75 -111)"
            fill={`url(#${idPrefix}Violet)`}
            opacity={0.38}
          />
        </AnimatedG>
      </G>
    </LoaderCanvas>
  );
}

/**
 * The off-centre highlight riding over the orb. Its gradient is anchored to the
 * shape's own box, so spinning the disc sweeps the bright crescent around.
 */
export function ShineArtwork() {
  return (
    <LoaderCanvas>
      <Defs>
        <RadialGradient
          id="activitySyncShine"
          cx="63.67%"
          cy="56.61%"
          r="76.66%"
        >
          <Stop offset="0.62" stopColor="#D347FF" stopOpacity={0} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={1} />
        </RadialGradient>
      </Defs>
      <Circle r={137.256263} fill="url(#activitySyncShine)" />
    </LoaderCanvas>
  );
}

/**
 * The cage in *front* of the orb: the equator, the trailing dot, the dotted
 * quarter sweep, and the meridian pair mirrored against the back one.
 */
export function FrontRingsArtwork({ progress }: MeridianArtworkProps) {
  const arc = useAnimatedProps(() => ({
    d: meridianPath(-meridianPhase(progress.value)),
  }));
  const sweep = useAnimatedProps<GroupMatrixProps>(() => ({
    matrix: rotationMatrix(progress.value * RING_ROTATION_DEG),
  }));

  return (
    <LoaderCanvas>
      <Defs>
        <LinearGradient
          id="activitySyncSweep"
          x1="1.01278"
          y1="0.912121"
          x2="-0.03944"
          y2="0.00449"
        >
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </LinearGradient>
        <RadialGradient id="activitySyncDot" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle
        r={200}
        fill="none"
        opacity={0.5}
        stroke="#FFFFFF"
        strokeWidth={2}
      />
      <Circle
        cx={200}
        r={39.46285}
        fill="url(#activitySyncDot)"
        opacity={0.2}
      />
      <AnimatedG animatedProps={sweep}>
        <Path
          d="M0-200C110.45695-200 200-110.45695 200 0"
          fill="none"
          stroke="url(#activitySyncSweep)"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray="0.01,14.26"
        />
      </AnimatedG>
      <AnimatedPath
        animatedProps={arc}
        fill="none"
        opacity={0.5}
        stroke="#FFFFFF"
        strokeWidth={2}
      />
      <G rotation={MERIDIAN_TILT_DEG}>
        <AnimatedPath
          animatedProps={arc}
          fill="none"
          opacity={0.5}
          stroke="#FFFFFF"
          strokeWidth={2}
        />
      </G>
    </LoaderCanvas>
  );
}
