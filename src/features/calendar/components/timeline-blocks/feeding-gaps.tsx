import { memo } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useActivityColors } from "@/hooks/use-activity-colors";

import { TIMELINE_Z_INDEX } from "../../constants";
import { formatDuration, laneLeft, type Translate } from "../../helpers";
import { feedingGaps, type FeedingInterval } from "./helpers";

// Wide enough for the longest localized duration; the line runs down its middle.
const GAP_WIDTH = 120;
const LINE_WIDTH = 1.5;
const LABEL_MIN_HEIGHT = 18;

interface FeedingGapsProps {
  feedings: FeedingInterval[];
  hourHeight: number;
  dayStartMs: number;
  t: Translate;
}

export const FeedingGaps = memo(function FeedingGaps({
  feedings,
  hourHeight,
  dayStartMs,
  t,
}: FeedingGapsProps) {
  const { timelineGradients: gradients, fg, accent } = useActivityColors();

  return (
    <>
      {feedingGaps(feedings, dayStartMs, hourHeight).map((gap) => (
        <View
          key={`feeding-gap-${gap.from}`}
          pointerEvents="none"
          style={[styles.gap, { top: gap.top, height: gap.height }]}
        >
          <View style={styles.lineClip}>
            <View style={[styles.lineDashes, { borderColor: accent.feed }]} />
          </View>
          {gap.height >= LABEL_MIN_HEIGHT && (
            <View
              style={[
                styles.label,
                { backgroundColor: gradients.feed[0], borderColor: accent.feed },
              ]}
            >
              <ThemedText numberOfLines={1} style={[styles.labelText, { color: fg.feed }]}>
                {formatDuration(gap.to - gap.from, t("unit.hours"), t("unit.minutes"))}
              </ThemedText>
            </View>
          )}
        </View>
      ))}
    </>
  );
});

const styles = StyleSheet.create({
  gap: {
    position: "absolute",
    left: laneLeft("feeding"),
    width: GAP_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    // Level with the feeding blocks, which are drawn later and so stay on top.
    zIndex: TIMELINE_Z_INDEX.event + 1,
  },
  // Native dashed borders need the same width on every side, so a fully dashed
  // box is clipped down to its left edge.
  lineClip: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: LINE_WIDTH,
    overflow: "hidden",
  },
  lineDashes: {
    position: "absolute",
    top: -LINE_WIDTH,
    bottom: -LINE_WIDTH,
    left: 0,
    width: LINE_WIDTH * 4,
    borderWidth: LINE_WIDTH,
    borderStyle: "dashed",
  },
  label: {
    maxWidth: GAP_WIDTH,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  labelText: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "700",
  },
});
