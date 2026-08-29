import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { type ActivitySession } from "@/lib/activity-store";

import { breastSideMarker } from "../../breast-side-marker";
import { proDetailsIcon } from "../../pro-details";
import { styles } from "./styles";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface BlockContentProps {
  icon: IconName;
  proDetails?: ActivitySession["proDetails"];
  color: string;
  title: string;
  detail?: string;
  time?: string;
}

export function BlockContent({
  icon,
  proDetails,
  color,
  title,
  detail,
  time,
}: BlockContentProps) {
  const proIcon = proDetailsIcon(proDetails);
  const sideMarker = breastSideMarker(proDetails);

  return (
    <View style={styles.blockContent}>
      <View style={styles.blockRow}>
        <MaterialCommunityIcons name={icon} size={14} color={color} />
        {proIcon && (
          <MaterialCommunityIcons name={proIcon} size={14} color={color} />
        )}
        {sideMarker && (
          <ThemedText style={[styles.breastSideMarker, { color }]}>
            {sideMarker}
          </ThemedText>
        )}
        <ThemedText style={[styles.blockTitle, { color }]} numberOfLines={1}>
          {title}
          {detail ?? ""}
        </ThemedText>
      </View>
      {time && (
        <ThemedText style={[styles.blockTime, { color }]} numberOfLines={1}>
          {time}
        </ThemedText>
      )}
    </View>
  );
}
