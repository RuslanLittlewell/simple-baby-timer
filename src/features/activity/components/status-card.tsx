import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing, TimerFont } from "@/constants/theme";
import { fmtTime } from "@/features/calendar/helpers";
import { useActivityColors } from "@/hooks/use-activity-colors";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/state/app-state";

import { type GradKey } from "../constants";
import { formatElapsed } from "../helpers";
import { StatusIllustration } from "./status-illustration";

interface StatusCardProps {
  primaryKind: string | null;
  gradKey: GradKey | null;
  elapsed: number;
  startedAt: number | null;
  feedingActive: boolean;
}

export function StatusCard({
  primaryKind,
  gradKey,
  elapsed,
  startedAt,
  feedingActive,
}: StatusCardProps) {
  const t = useT();
  const theme = useTheme();
  const { surfaces } = useActivityColors();
  const running = !!primaryKind && !!gradKey;
  const night = primaryKind === "sleep" || primaryKind === "settling";

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.statusCard, borderColor: theme.statusCardBorder },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.head}>
          <View
            style={[
              styles.dot,
              styles.headDot,
              { backgroundColor: gradKey ? surfaces[gradKey].tint : theme.textMuted },
            ]}
          />
          <View style={styles.headText}>
            <ThemedText
              style={[styles.title, !running && { color: theme.textMuted }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {running ? t(`kind.${primaryKind}`) : t("activity.idle")}
            </ThemedText>
            {running && feedingActive && (
              <View
                accessibilityLabel={t("kind.feeding")}
                style={[styles.dot, { backgroundColor: surfaces.feed.tint }]}
              />
            )}
            {running && startedAt !== null && (
              <ThemedText
                numberOfLines={1}
                style={[styles.since, { color: theme.statusAccent }]}
              >
                {t("activity.since", { time: fmtTime(startedAt) })}
              </ThemedText>
            )}
          </View>
        </View>
        <ThemedText
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          style={[styles.timer, !running && { color: theme.textMuted }]}
        >
          {formatElapsed(running ? elapsed : 0)}
        </ThemedText>
      </View>
      <StatusIllustration night={night} active={running} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "stretch",
    flexDirection: "row",
    minHeight: 136,
    paddingLeft: 20,
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  content: {
    flexShrink: 1,
    justifyContent: "center",
    paddingVertical: 20,
    marginRight: Spacing.two,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.two,
  },
  headText: {
    flexShrink: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: Spacing.two,
    rowGap: Spacing.half,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  headDot: {
    marginTop: 7,
  },
  title: {
    flexShrink: 1,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "700",
  },
  timer: {
    fontFamily: TimerFont,
    fontSize: 46,
    lineHeight: 56,
    fontVariant: ["tabular-nums"],
  },
  since: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "600",
  },
});
