import { StyleSheet } from "react-native";

import { NunitoSans, Spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
  absoluteFill: StyleSheet.absoluteFillObject,
  backdrop: {
    flex: 1,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.four,
  },
  blur: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: "#3A3D43",
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: { fontSize: 18, lineHeight: 23, fontWeight: "700" },
  preview: { alignItems: "center" },
  previewCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  nameInput: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: NunitoSans.bold,
  },
  dateInput: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
  dateInputText: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  saveButton: {
    alignItems: "center",
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
  saveDisabled: { opacity: 0.35 },
  saveText: { fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.7 },
});
