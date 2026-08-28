import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useActivityColors } from "@/hooks/use-activity-colors";
import { useT } from "@/state/app-state";

import { NIGHT_WAKING_EVENT } from "../../../constants";
import { withAlpha } from "../helpers";
import { styles } from "../styles";

interface NightWakingButtonProps {
  disabled: boolean;
  onPress: () => void;
}

export function NightWakingButton({ disabled, onPress }: NightWakingButtonProps) {
  const t = useT();
  const { gradients, fg, accent } = useActivityColors();
  const gradKey = NIGHT_WAKING_EVENT.gradKey;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("kind.nightWaking")}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.nightWakingPressable,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={gradients[gradKey]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.nightWakingButton,
          { borderColor: withAlpha(accent[gradKey], 0.68) },
        ]}
      >
        <MaterialCommunityIcons name={NIGHT_WAKING_EVENT.icon} size={24} color={fg[gradKey]} />
        <ThemedText numberOfLines={2} style={[styles.nightWakingLabel, { color: fg[gradKey] }]}>
          {t("kind.nightWaking")}
        </ThemedText>
      </LinearGradient>
    </Pressable>
  );
}
