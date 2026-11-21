import { LinearGradient } from "expo-linear-gradient";
import {
  type GestureResponderEvent,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useActivityColors } from "@/hooks/use-activity-colors";
import { useT } from "@/state/app-state";

import {
  ACTION_RADIUS,
  CARD_HEIGHT,
  CONTROL_SIZE,
  type GradKey,
  type IconName,
} from "../constants";
import { ActivityIcon } from "./activity-icon";
import { TimerToggleIcon } from "./timer-toggle-icon";

interface ActivityRowProps {
  icon: IconName;
  gradKey: GradKey;
  label: string;
  isActive: boolean;
  dimmed?: boolean;
  disabled?: boolean;
  onPress: () => void;
  onStop?: () => void;
}

export function ActivityRow({
  icon,
  gradKey,
  label,
  isActive,
  dimmed,
  disabled = false,
  onPress,
  onStop,
}: ActivityRowProps) {
  const t = useT();
  const { surfaces } = useActivityColors();
  const surface = surfaces[gradKey];
  const stopEnabled = !disabled && isActive && !!onStop;

  const handleStopPress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onStop?.();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isActive ? `${label}, ${t("activity.active")}` : label}
      accessibilityState={{ disabled, selected: isActive }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: surface.fill,
          borderColor: isActive ? surface.activeBorder : surface.border,
        },
        isActive && styles.rowActive,
        (dimmed || disabled) && styles.rowDimmed,
        pressed && styles.pressed,
      ]}
    >
      {surface.gradient && (
        <LinearGradient
          colors={surface.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.iconSlot}>
        <ActivityIcon name={icon} size={26} color={surface.icon} />
      </View>
      <View style={styles.labelGroup}>
        <ThemedText
          style={[styles.label, { color: surface.label }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {label}
        </ThemedText>
        {isActive && (
          <View style={[styles.badge, { borderColor: surface.activeBorder }]}>
            <ThemedText
              numberOfLines={1}
              style={[styles.badgeText, { color: surface.activeBorder }]}
            >
              {t("activity.active")}
            </ThemedText>
          </View>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !stopEnabled }}
        disabled={!stopEnabled}
        hitSlop={stopEnabled ? 6 : undefined}
        onPress={handleStopPress}
        style={styles.toggleButton}
      >
        <TimerToggleIcon active={isActive} surface={surface} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: CARD_HEIGHT,
    paddingVertical: Spacing.two,
    paddingLeft: Spacing.three,
    paddingRight: 10,
    borderRadius: ACTION_RADIUS,
    borderWidth: 1,
    overflow: "hidden",
  },
  rowActive: {
    borderWidth: 1.5,
  },
  rowDimmed: {
    opacity: 0.45,
  },
  iconSlot: {
    width: 28,
    alignItems: "center",
  },
  labelGroup: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: Spacing.two,
    rowGap: Spacing.one,
  },
  label: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  badge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  pressed: {
    opacity: 0.75,
  },
  toggleButton: {
    width: CONTROL_SIZE,
    height: CONTROL_SIZE,
  },
});
