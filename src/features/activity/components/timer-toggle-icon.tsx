import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";

import { useAppStore } from "@/state/app-state";

const withAlpha = (hex: string, alpha: number) => {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
};

interface TimerToggleIconProps {
  active: boolean;

  accent: string;

  darkBackgroundColor?: string;
}

export function TimerToggleIcon({
  active,
  accent,
  darkBackgroundColor,
}: TimerToggleIconProps) {
  const mode = useAppStore((state) => state.themeMode);
  const isLight = mode === "light";
  const circleColor = darkBackgroundColor ?? accent;

  return (
    <View
      style={[
        styles.circle,
        {
          backgroundColor: withAlpha(circleColor, isLight ? 0.14 : 0.2),
          borderColor: withAlpha(circleColor, isLight ? 0.32 : 0.38),
        },
      ]}
    >
      <MaterialCommunityIcons
        name={active ? "stop" : "play"}
        size={18}
        color={isLight ? circleColor : "#FFFFFF"}
        style={!active && styles.playGlyph}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  playGlyph: {
    marginLeft: 2,
  },
});
