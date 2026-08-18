import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import {
  formatDuration,
  fmtTime,
  type DayStats,
} from "@/features/calendar/helpers";
import { useActivityColors } from "@/hooks/use-activity-colors";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/state/app-state";

interface DayStatsRowProps {
  stats: DayStats;
}

interface StatCardContent {
  value: string;
  label: string;
  color: string;
}

interface InteractiveStatCardProps extends StatCardContent {
  accessibilityHint: string;
  selectedIndex: number;
  optionCount?: number;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function withAlpha(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}

function StatContent({ value, label, color }: StatCardContent) {
  return (
    <>
      <ThemedText
        type="smallBold"
        numberOfLines={1}
        style={{ color }}
      >
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
        {label}
      </ThemedText>
    </>
  );
}

function InteractiveStatCard({
  value,
  label,
  color,
  accessibilityHint,
  selectedIndex,
  optionCount = 2,
  onPress,
}: InteractiveStatCardProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    cancelAnimation(scale);
    scale.value = withTiming(0.96, { duration: 90 });
  };

  const handlePressOut = () => {
    cancelAnimation(scale);
    scale.value = withSpring(1, { damping: 12, stiffness: 260, mass: 0.5 });
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        styles.interactiveCard,
        {
          backgroundColor: theme.backgroundElement,
          shadowColor: theme.text,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.interactiveContent} pointerEvents="none">
        <View style={styles.badgeSlot}>
          <View
            style={[
              styles.swapBadge,
              { backgroundColor: withAlpha(color, 0.14) },
            ]}
          >
            <MaterialCommunityIcons
              name="swap-horizontal"
              size={12}
              color={color}
              style={selectedIndex > 0 && styles.swapIconAlternate}
            />
          </View>
        </View>
        <StatContent value={value} label={label} color={color} />
        <View style={styles.positionIndicator}>
          {Array.from({ length: optionCount }, (_, index) => {
            const active = index === selectedIndex;
            return (
              <View
                key={index}
                style={[
                  styles.positionPill,
                  active ? styles.positionPillActive : styles.positionPillInactive,
                  { backgroundColor: active ? color : theme.border },
                ]}
              />
            );
          })}
        </View>
      </View>
    </AnimatedPressable>
  );
}

export function DayStatsRow({ stats }: DayStatsRowProps) {
  const t = useT();
  const { accent } = useActivityColors();
  const [showAwake, setShowAwake] = useState(false);
  const [feedingView, setFeedingView] = useState<0 | 1 | 2>(0);
  const [showPoop, setShowPoop] = useState(false);

  const handleSleepToggle = () => setShowAwake((current) => !current);
  const handleFeedingToggle = () =>
    setFeedingView((current) => ((current + 1) % 3) as 0 | 1 | 2);
  const handleDiaperToggle = () => setShowPoop((current) => !current);

  const sleepMetric: StatCardContent = showAwake
    ? {
        color: accent.awake,
        value: formatDuration(
          stats.awakeMs,
          t("unit.hours"),
          t("unit.minutes"),
        ),
        label: t("kind.awake"),
      }
    : {
        color: accent.sleep,
        value: formatDuration(
          stats.sleepMs,
          t("unit.hours"),
          t("unit.minutes"),
        ),
        label: t("kind.sleep"),
      };

  const feedingMetric: StatCardContent = feedingView === 1
    ? {
        color: accent.feed,
        value: `${stats.milkMl} ${t("unit.ml")}`,
        label: t("calendar.milk"),
      }
    : feedingView === 2
      ? {
          color: accent.feed,
          value: stats.lastFeedingAt === null ? "—" : fmtTime(stats.lastFeedingAt),
          label: t("stats.lastFeeding"),
        }
    : {
        color: accent.feed,
        value: String(stats.feedingCount),
        label: t("kind.feeding"),
      };

  const diaperMetric: StatCardContent = showPoop
    ? {
        color: accent.poop,
        value: String(stats.poopCount),
        label: "💩",
      }
    : {
        color: accent.diaper,
        value: String(stats.diaperCount),
        label: t("kind.diaper"),
      };

  const sleepHint = t("stats.showMetric", {
    metric: t(showAwake ? "kind.sleep" : "kind.awake"),
  });
  const feedingHint = t("stats.showMetric", {
    metric: feedingView === 0
      ? t("calendar.milk")
      : feedingView === 1
        ? t("stats.lastFeeding")
        : t("kind.feeding"),
  });
  const diaperHint = t("stats.showMetric", {
    metric: showPoop ? t("kind.diaper") : "💩",
  });

  return (
    <View style={styles.row}>
      <InteractiveStatCard
        {...sleepMetric}
        accessibilityHint={sleepHint}
        selectedIndex={showAwake ? 1 : 0}
        onPress={handleSleepToggle}
      />
      <InteractiveStatCard
        {...feedingMetric}
        accessibilityHint={feedingHint}
        selectedIndex={feedingView}
        optionCount={3}
        onPress={handleFeedingToggle}
      />
      <InteractiveStatCard
        {...diaperMetric}
        accessibilityHint={diaperHint}
        selectedIndex={showPoop ? 1 : 0}
        onPress={handleDiaperToggle}
      />
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
    justifyContent: "center",
    gap: Spacing.half,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
  interactiveCard: {
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.two,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  interactiveContent: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.half,
    minHeight: 52,
    paddingHorizontal: Spacing.one,
  },
  badgeSlot: {
    alignSelf: "stretch",
    height: 16,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  swapBadge: {
    width: 22,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  swapIconAlternate: {
    transform: [{ rotate: "180deg" }],
  },
  positionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.half,
    height: 4,
    marginTop: Spacing.half,
  },
  positionPill: {
    height: 3,
    borderRadius: 2,
  },
  positionPillActive: {
    width: 14,
  },
  positionPillInactive: {
    width: 6,
  },
});
