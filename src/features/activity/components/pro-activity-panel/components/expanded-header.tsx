import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, type GestureResponderEvent } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useT } from "@/state/app-state";

import { withAlpha, type ProKind } from "../helpers";
import { styles } from "../styles";

interface ExpandedHeaderProps {
  color: string;
  kind: ProKind;
  onClose: () => void;
}

export function ExpandedHeader({ color, kind, onClose }: ExpandedHeaderProps) {
  const t = useT();
  const handleClosePress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onClose();
  };
  const icon = kind === "settling" ? "sleep" : kind === "sleep" ? "moon-waning-crescent" : "baby-bottle-outline";

  return (
    <Pressable onPress={onClose} style={styles.header}>
      <MaterialCommunityIcons name={icon} size={26} color={color} />
      <ThemedText style={[styles.title, { color }]}>{t(`pro.${kind}`)}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("editor.cancel")}
        hitSlop={10}
        onPress={handleClosePress}
        style={[
          styles.closeButton,
          {
            borderColor: withAlpha(color, 0.34),
            backgroundColor: withAlpha(color, 0.14),
          },
        ]}
      >
        <MaterialCommunityIcons name="close" size={26} color={color} />
      </Pressable>
    </Pressable>
  );
}
