import { createContext, useContext } from "react";
import { Platform, useWindowDimensions } from "react-native";

export interface ActivityDensity {
  compact: boolean;
  dense: boolean;
}

// Android status, navigation and tab bars differ too much between phones to
// judge from the window size, so the Activity screen measures the height it
// actually got and hands the result down through this context.
export const ActivityDensityContext = createContext<ActivityDensity | null>(null);

// Height (dp) below the status bar that the Activity layout needs at each density.
const REGULAR_MIN_HEIGHT = 700;
const COMPACT_MIN_HEIGHT = 630;

export function densityForHeight(height: number): ActivityDensity {
  return {
    compact: height < REGULAR_MIN_HEIGHT,
    dense: height < COMPACT_MIN_HEIGHT,
  };
}

export function useWindowActivityDensity(): ActivityDensity {
  const { width, height } = useWindowDimensions();
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);
  const smallIPhone = Platform.OS === "ios" && shortSide <= 375;

  return {
    compact: smallIPhone && longSide <= 812,
    dense: smallIPhone && longSide <= 700,
  };
}

export function useCompactActivityLayout() {
  const measured = useContext(ActivityDensityContext);
  const fromWindow = useWindowActivityDensity();
  return (measured ?? fromWindow).compact;
}

export function useDenseActivityLayout() {
  const measured = useContext(ActivityDensityContext);
  const fromWindow = useWindowActivityDensity();
  return (measured ?? fromWindow).dense;
}
