import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useActivityColors } from "@/hooks/use-activity-colors";
import { useT } from "@/state/app-state";

import { NIGHT_WAKING_EVENT } from "../../../constants";
import { styles } from "../styles";

interface NightWakingButtonProps {
  disabled: boolean;
  onPress: () => void;
}

export function NightWakingButton({ disabled, onPress }: NightWakingButtonProps) {
  const t = useT();
  const { surfaces } = useActivityColors();
  const surface = surfaces[NIGHT_WAKING_EVENT.gradKey];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("kind.nightWaking")}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.nightWakingButton,
        { backgroundColor: surface.fill, borderColor: surface.border },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons name={NIGHT_WAKING_EVENT.icon} size={24} color={surface.icon} />
      <ThemedText numberOfLines={2} style={[styles.nightWakingLabel, { color: surface.label }]}>
        {t("kind.nightWaking")}
      </ThemedText>
    </Pressable>
  );
}
