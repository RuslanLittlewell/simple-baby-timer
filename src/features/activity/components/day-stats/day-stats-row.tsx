import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { type DayStats } from "@/features/calendar/helpers";
import { useActivityColors } from "@/hooks/use-activity-colors";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/state/app-state";
import { useDenseActivityLayout } from "../../use-compact-activity-layout";

import {
  getDiaperMetrics,
  getFeedingMetrics,
  getNextMetricHint,
  getSleepMetrics,
  nextMetricIndex,
  type MetricIndex,
  type StatCardContent,
  withAlpha,
} from "./helpers";
import { styles } from "./styles";

interface DayStatsRowProps {
  stats: DayStats;
}

interface InteractiveStatCardProps extends StatCardContent {
  dense: boolean;
  accessibilityHint: string;
  selectedIndex: number;
  optionCount?: number;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function StatContent({ value, label, color }: StatCardContent) {
  return (
    <>
      <ThemedText type="smallBold" numberOfLines={1} style={{ color }}>
        {value}
      </ThemedText>
      <ThemedText
        type="small"
        themeColor="textSecondary"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={styles.metricLabel}
      >
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
  dense,
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
        dense && styles.interactiveCardDense,
        {
          backgroundColor: theme.backgroundElement,
          shadowColor: theme.text,
        },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.interactiveContent,
          dense && styles.interactiveContentDense,
        ]}
        pointerEvents="none"
      >
        <View style={[styles.badgeSlot, dense && styles.badgeSlotDense]}>
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
                  active
                    ? styles.positionPillActive
                    : styles.positionPillInactive,
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
  const [showAwake, setShowAwake] = useState<MetricIndex>(0);
  const [feedingView, setFeedingView] = useState<MetricIndex>(0);
  const [showPoop, setShowPoop] = useState<MetricIndex>(0);
  const dense = useDenseActivityLayout();

  const handleSleepToggle = () => setShowAwake(nextMetricIndex);
  const handleFeedingToggle = () => setFeedingView(nextMetricIndex);
  const handleDiaperToggle = () =>
    setShowPoop((current) => nextMetricIndex(current, 4));

  const sleepMetrics = getSleepMetrics(stats, accent, t);
  const feedingMetrics = getFeedingMetrics(stats, accent, t);
  const diaperMetrics = getDiaperMetrics(stats, accent, t);

  const sleepMetric = sleepMetrics[showAwake];
  const feedingMetric = feedingMetrics[feedingView];
  const diaperMetric = diaperMetrics[showPoop];

  const sleepHint = getNextMetricHint(sleepMetrics, showAwake, t);
  const feedingHint = getNextMetricHint(feedingMetrics, feedingView, t);
  const diaperHint = getNextMetricHint(diaperMetrics, showPoop, t);

  return (
    <View style={styles.row}>
      <InteractiveStatCard
        dense={dense}
        {...sleepMetric}
        accessibilityHint={sleepHint}
        selectedIndex={showAwake}
        optionCount={3}
        onPress={handleSleepToggle}
      />
      <InteractiveStatCard
        dense={dense}
        {...feedingMetric}
        accessibilityHint={feedingHint}
        selectedIndex={feedingView}
        optionCount={3}
        onPress={handleFeedingToggle}
      />
      <InteractiveStatCard
        dense={dense}
        {...diaperMetric}
        accessibilityHint={diaperHint}
        selectedIndex={showPoop}
        optionCount={4}
        onPress={handleDiaperToggle}
      />
    </View>
  );
}
