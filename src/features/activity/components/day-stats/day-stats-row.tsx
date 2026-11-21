import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { type DayStats } from "@/features/calendar/helpers";
import { useActivityColors } from "@/hooks/use-activity-colors";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/state/app-state";

import { ActivityIcon } from "../activity-icon";

import {
  getDiaperMetrics,
  getFeedingMetrics,
  getNextMetricHint,
  getSleepMetrics,
  nextMetricIndex,
  type MetricIndex,
  type StatCardContent,
} from "./helpers";
import { styles } from "./styles";

interface DayStatsRowProps {
  stats: DayStats;
}

interface StatColumnProps extends StatCardContent {
  accessibilityHint: string;
  selectedIndex: number;
  optionCount: number;
  onPress: () => void;
}

const NOW_REFRESH_MS = 15_000;

function StatColumn({
  icon,
  value,
  label,
  color,
  accessibilityHint,
  selectedIndex,
  optionCount,
  onPress,
}: StatColumnProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.column, pressed && styles.pressed]}
    >
      <ActivityIcon name={icon} size={20} color={color} />
      <ThemedText
        numberOfLines={2}
        style={[styles.label, { color: theme.textMuted }]}
      >
        {label}
      </ThemedText>
      <ThemedText numberOfLines={2} style={styles.value}>
        {value}
      </ThemedText>
      <View style={styles.positionIndicator}>
        {Array.from({ length: optionCount }, (_, index) => {
          const active = index === selectedIndex;
          return (
            <View
              key={index}
              style={[
                styles.positionPill,
                active ? styles.positionPillActive : styles.positionPillInactive,
                { backgroundColor: active ? color : theme.hairline },
              ]}
            />
          );
        })}
      </View>
    </Pressable>
  );
}

export function DayStatsRow({ stats }: DayStatsRowProps) {
  const t = useT();
  const theme = useTheme();
  const { surfaces } = useActivityColors();
  const [showAwake, setShowAwake] = useState<MetricIndex>(0);
  const [feedingView, setFeedingView] = useState<MetricIndex>(0);
  const [showPoop, setShowPoop] = useState<MetricIndex>(0);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), NOW_REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const iconColors = {
    sleep: surfaces.sleep.tint,
    awake: surfaces.awake.tint,
    feed: surfaces.feed.tint,
    diaper: surfaces.diaper.tint,
    poop: surfaces.poop.tint,
  };

  const sleepMetrics = getSleepMetrics(stats, iconColors, t);
  const feedingMetrics = getFeedingMetrics(stats, iconColors, t, now);
  const diaperMetrics = getDiaperMetrics(stats, iconColors, t);

  const divider = <View style={[styles.divider, { backgroundColor: theme.hairline }]} />;

  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: theme.panel, borderColor: theme.hairline },
      ]}
    >
      <StatColumn
        {...sleepMetrics[showAwake]}
        accessibilityHint={getNextMetricHint(sleepMetrics, showAwake, t)}
        selectedIndex={showAwake}
        optionCount={sleepMetrics.length}
        onPress={() => setShowAwake((current) => nextMetricIndex(current, sleepMetrics.length))}
      />
      {divider}
      <StatColumn
        {...feedingMetrics[feedingView]}
        accessibilityHint={getNextMetricHint(feedingMetrics, feedingView, t)}
        selectedIndex={feedingView}
        optionCount={feedingMetrics.length}
        onPress={() => setFeedingView((current) => nextMetricIndex(current, feedingMetrics.length))}
      />
      {divider}
      <StatColumn
        {...diaperMetrics[showPoop]}
        accessibilityHint={getNextMetricHint(diaperMetrics, showPoop, t)}
        selectedIndex={showPoop}
        optionCount={diaperMetrics.length}
        onPress={() => setShowPoop((current) => nextMetricIndex(current, diaperMetrics.length))}
      />
    </View>
  );
}
