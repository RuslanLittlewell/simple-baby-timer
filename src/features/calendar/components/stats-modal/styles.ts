import { StyleSheet } from "react-native";

import { Spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
  absoluteFill: StyleSheet.absoluteFillObject,
  backdrop: { padding: Spacing.two },
  card: { maxWidth: 560, height: "82%", padding: Spacing.three },
  tabs: {
    flexDirection: "row",
    gap: Spacing.one,
    padding: Spacing.half,
    borderRadius: Spacing.three,
  },
  tab: {
    flex: 1,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Spacing.three - 2,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navLabel: { fontVariant: ["tabular-nums"] },
  body: { flex: 1 },
  bodyContent: { gap: Spacing.three, paddingBottom: Spacing.two },
  dayStats: { gap: Spacing.two },
  periodRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.two,
  },
  period: { flex: 1, gap: Spacing.three },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    minHeight: 36,
  },
  statLabel: { flex: 1 },
  statSpacer: { flex: 1 },
  comparison: {
    gap: Spacing.two,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginTop: Spacing.two,
  },
  comparisonRow: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  comparisonDot: { width: 9, height: 9, borderRadius: 5 },
  comparisonLabel: { flex: 1 },
});
