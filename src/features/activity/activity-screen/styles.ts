import { StyleSheet } from "react-native";

import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  safeArea: {
    flex: 1,
    alignSelf: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    width: "100%",
  },
  safeAreaDense: {
    paddingBottom: BottomTabInset + Spacing.one,
  },
  header: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.four,
  },
  headerDense: {
    paddingTop: Spacing.one,
  },
  childChip: {
    height: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#111827",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  childChipDense: {
    height: 28,
  },
  childInfo: {
    maxWidth: 190,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  childName: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 14,
  },
  childAge: {
    fontSize: 11,
    lineHeight: 14,
  },
  center: {
    flex: 1,
    alignSelf: "stretch",
    justifyContent: "center",
    gap: Spacing.five,
  },
  centerDense: {
    gap: Spacing.three,
  },
  list: {
    gap: Spacing.one,
  },
  eventRow: {
    flexDirection: "row",
    alignSelf: "stretch",
    gap: Spacing.one,
  },
  eventNarrow: {
    flex: 2,
  },
  eventWide: {
    flex: 6,
  },
  pressed: {
    opacity: 0.7,
  },
  syncOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  syncBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  syncLoader: {
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
