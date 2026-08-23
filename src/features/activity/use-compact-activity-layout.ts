import { Platform, useWindowDimensions } from "react-native";

export function useCompactActivityLayout() {
  const { width, height } = useWindowDimensions();
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);

  return Platform.OS === "ios" && shortSide <= 375 && longSide <= 812;
}

export function useDenseActivityLayout() {
  const { width, height } = useWindowDimensions();
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);

  return Platform.OS === "ios" && shortSide <= 375 && longSide <= 700;
}
