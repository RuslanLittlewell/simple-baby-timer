import { StyleSheet } from "react-native";

import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";

import { ACTION_GAP } from "../constants";

const SCREEN_GUTTER = 20;
const BLOCK_GAP = 14;
const AVATAR_SIZE = 52;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignSelf: "center",
    width: "100%",
    maxWidth: MaxContentWidth,
    gap: BLOCK_GAP,
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  profileStack: {
    flexShrink: 1,
    alignItems: "flex-start",
    gap: 6,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 44,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: {
    flexShrink: 1,
  },
  childName: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  },
  childAge: {
    fontSize: 15,
    lineHeight: 20,
  },
  menuSlot: {
    minHeight: AVATAR_SIZE,
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
    minHeight: 32,
    marginBottom: -Spacing.one,
  },
  sectionTitle: {
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
  },
  activityActionsRegion: {
    position: "relative",
  },
  list: {
    gap: ACTION_GAP,
  },
  eventRow: {
    flexDirection: "row",
    alignSelf: "stretch",
    gap: ACTION_GAP,
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
});
