import { StyleSheet } from "react-native";

import { LOADER_HEIGHT, LOADER_WIDTH } from "./helpers";

export const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: LOADER_WIDTH,
    height: LOADER_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    transform: [
      { translateX: -LOADER_WIDTH / 2 },
      { translateY: -LOADER_HEIGHT / 2 },
    ],
    zIndex: 10,
  },
  canvas: {
    width: LOADER_WIDTH,
    height: LOADER_HEIGHT,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
