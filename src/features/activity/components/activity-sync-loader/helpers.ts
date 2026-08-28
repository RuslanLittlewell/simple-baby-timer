export const LOADER_WIDTH = 72;
export const LOADER_HEIGHT = 48;

/**
 * The SVGator source nests every form in `matrix(.68 0 0 .68 10 -140)` inside a
 * mostly empty `-300 -340 600 400` frame. We drop that wrapper and draw in the
 * source's inner coordinates instead, so the 3:2 canvas is cropped to the orb.
 */
export const LOADER_VIEW_BOX = "-330 -220 660 440";
export const LOADER_DURATION_MS = 3000;

/** Both meridian cages sweep half a turn per cycle; the loop closes on itself. */
export const RING_ROTATION_DEG = 180;
/** The shine crescent and the dashed sweep take a full turn per cycle. */
export const SWEEP_ROTATION_DEG = 360;

export const RING_MIN_SCALE = 0.920668;
export const CORE_MIN_SCALE = 0.9;
export const SHINE_MIN_SCALE = 0.8;

export const BLOB_ROTATION_RANGE = [-15, 45] as const;
export const FLARE_MAX_OPACITY = 0.25;

export interface LoaderPalette {
  coreFrom: string;
  coreTo: string;
  glow: string;
  violet: string;
}

/** The source palette, as authored. */
export const BASE_PALETTE: LoaderPalette = {
  coreFrom: "#0054FF",
  coreTo: "#FC0137",
  glow: "#FA01FC",
  violet: "#D347FF",
};

/**
 * The same palette pushed through `hueRotate(-45deg)`, which is what the
 * source's `feColorMatrix` reaches at the midpoint of the cycle. Cross-fading
 * the two palettes reproduces the colour pulse without an animated filter,
 * which react-native-svg cannot drive from the UI thread.
 */
export const SHIFTED_PALETTE: LoaderPalette = {
  coreFrom: "#007D94",
  coreTo: "#C603C1",
  glow: "#472FFF",
  violet: "#536AFF",
};

/** Ease-in-out ping-pong over one loop: 0 at both ends, 1 at the midpoint. */
export function pulse(progress: number) {
  "worklet";
  return (1 - Math.cos(progress * 2 * Math.PI)) / 2;
}

/** Eases a 0..1 range down to `min` and back, the way the source breathes. */
export function breathe(progress: number, min: number) {
  "worklet";
  return 1 - (1 - min) * pulse(progress);
}

/**
 * Meridian sweep: top arc (-1) collapses to a flat line (0) at the midpoint,
 * then bulges into the bottom arc (1). Half of the cage runs this inverted.
 */
export function meridianPhase(progress: number) {
  "worklet";
  if (progress < 0.5) {
    const eased = progress * 2;
    return eased * eased - 1;
  }
  const eased = 2 - progress * 2;
  return 1 - eased * eased;
}

/** Half-ellipse from (200,0) to (-200,0), bulging by `phase` (-1 up, 1 down). */
export function meridianPath(phase: number) {
  "worklet";
  const grip = 110.45695 * phase;
  const apex = 200 * phase;
  return `M200 0C200 ${grip} 110.45695 ${apex} 0 ${apex}C-110.45695 ${apex} -200 ${grip} -200 0`;
}

/** SVG `matrix(a b c d e f)` for a rotation about the local origin. */
export function rotationMatrix(degrees: number) {
  "worklet";
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return [cos, sin, -sin, cos, 0, 0];
}
