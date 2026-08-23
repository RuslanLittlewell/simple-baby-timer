import { StyleSheet } from "react-native";

import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";

export const PANEL_GAP = Spacing.two;

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
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  childChipDense: {
    paddingVertical: Spacing.one,
  },
  childInfo: {
    maxWidth: 190,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  childName: {
    flexShrink: 1,
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
    gap: Spacing.two,
  },
  pager: {
    alignSelf: "stretch",
    gap: Spacing.three,
    position: "relative",
  },
  pagerContent: {
    gap: PANEL_GAP,
  },
  pageIndicator: {
    flexDirection: "row",
    alignSelf: "center",
    gap: Spacing.two,
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  pageDotActive: {
    width: 18,
    backgroundColor: "#C4B5FD",
  },
  eventRow: {
    flexDirection: "row",
    alignSelf: "stretch",
    gap: Spacing.two,
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
