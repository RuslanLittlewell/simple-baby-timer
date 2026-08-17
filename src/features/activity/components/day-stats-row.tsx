import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { formatDuration, type DayStats } from "@/features/calendar/helpers";
import { useActivityColors } from "@/hooks/use-activity-colors";
import { useT } from "@/state/app-state";

interface DayStatsRowProps {
  stats: DayStats;
}

export function DayStatsRow({ stats }: DayStatsRowProps) {
  const t = useT();
  const { accent } = useActivityColors();

  const items = [
    {
      key: "sleep",
      color: accent.sleep,
      value: formatDuration(stats.sleepMs, t("unit.hours"), t("unit.minutes")),
      label: t("kind.sleep"),
    },
    {
      key: "feeding",
      color: accent.feed,
      value: String(stats.feedingCount),
      label: t("kind.feeding"),
    },
    {
      key: "diaper",
      color: accent.diaper,
      value: String(stats.diaperCount),
      label: t("kind.diaper"),
    },
    {
      key: "poop",
      color: accent.poop,
      value: String(stats.poopCount),
      label: "💩",
    },
  ];

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <ThemedView key={item.key} type="backgroundElement" style={styles.card}>
          <ThemedText
            type="smallBold"
            numberOfLines={1}
            style={{ color: item.color }}
          >
            {item.value}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {item.label}
          </ThemedText>
        </ThemedView>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignSelf: "stretch",
    gap: Spacing.two,
  },
  card: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.half,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
});
