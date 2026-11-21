import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";

import { type ActivitySurface } from "@/constants/activities";

import { CONTROL_SIZE } from "../constants";

interface TimerToggleIconProps {
  active: boolean;
  surface: ActivitySurface;
}

export function TimerToggleIcon({ active, surface }: TimerToggleIconProps) {
  return (
    <View
      style={[
        styles.circle,
        { backgroundColor: surface.control, borderColor: surface.controlBorder },
      ]}
    >
      <MaterialCommunityIcons
        name={active ? "stop" : "play"}
        size={20}
        color={surface.controlIcon}
        style={!active && styles.playGlyph}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: CONTROL_SIZE,
    height: CONTROL_SIZE,
    borderRadius: CONTROL_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  playGlyph: {
    marginLeft: 2,
  },
});
