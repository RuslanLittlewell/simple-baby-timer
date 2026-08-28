import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useActivityColors } from "@/hooks/use-activity-colors";

import { withAlpha } from "../helpers";
import { styles } from "../styles";

interface ChoiceProps {
  tone?: "feed" | "sleep";
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  selected: boolean;
  multiline?: boolean;
  onPress: () => void;
}

export function Choice({
  tone = "feed",
  icon,
  label,
  selected,
  multiline,
  onPress,
}: ChoiceProps) {
  const { fg } = useActivityColors();
  const sleep = tone === "sleep";
  const ink = fg.sleep;
  const contentColor = !sleep || selected ? "#3E2D19" : ink;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        sleep && [
          styles.choiceSleep,
          {
            borderColor: withAlpha(ink, 0.62),
            backgroundColor: withAlpha(ink, 0.14),
          },
        ],
        selected &&
          (sleep
            ? [styles.choiceSleepSelected, { borderColor: ink }]
            : styles.choiceSelected),
        pressed && styles.pressed,
      ]}
    >
      {icon && (
        <MaterialCommunityIcons name={icon} size={20} color={contentColor} />
      )}
      <ThemedText
        style={[styles.choiceText, { color: contentColor }]}
        numberOfLines={multiline ? 2 : 1}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}
