import { StyleSheet } from "react-native";

import { Spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
  panel: {
    flexDirection: "row",
    alignSelf: "stretch",
    borderRadius: 22,
    borderWidth: 1,
  },
  column: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.half,
    paddingTop: Spacing.two,
    paddingBottom: 6,
    paddingHorizontal: Spacing.one,
  },
  divider: {
    width: StyleSheet.hairlineWidth * 2,
    marginVertical: 12,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
  },
  value: {
    alignSelf: "stretch",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  positionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.half,
    height: 3,
    marginTop: Spacing.half,
  },
  positionPill: {
    height: 3,
    borderRadius: 2,
  },
  positionPillActive: {
    width: 12,
  },
  positionPillInactive: {
    width: 5,
  },
  pressed: {
    opacity: 0.6,
  },
});
