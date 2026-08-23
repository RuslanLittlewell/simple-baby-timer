import { StyleSheet } from "react-native";

import { Spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
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
  interactiveCardDense: {
    paddingVertical: Spacing.one,
  },
  interactiveContent: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.half,
    minHeight: 52,
    paddingHorizontal: Spacing.one,
  },
  interactiveContentDense: {
    minHeight: 42,
    gap: 0,
  },
  metricLabel: {
    fontSize: 10,
    lineHeight: 13,
  },
  badgeSlot: {
    alignSelf: "stretch",
    height: 16,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  badgeSlotDense: {
    height: 12,
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
