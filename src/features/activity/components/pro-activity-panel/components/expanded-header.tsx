import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, View, type GestureResponderEvent } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { type ActivitySurface } from "@/constants/activities";
import { useT } from "@/state/app-state";

import { ActivityIcon } from "../../activity-icon";
import { type ProKind } from "../helpers";
import { styles } from "../styles";

interface ExpandedHeaderProps {
  kind: ProKind;
  surface: ActivitySurface;
  running: boolean;
  progress: SharedValue<number>;
  onClose: () => void;
}

export function ExpandedHeader({ kind, surface, running, progress, onClose }: ExpandedHeaderProps) {
  const t = useT();
  const handleClosePress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onClose();
  };
  const icon = kind === "settling" ? "sleep" : kind === "sleep" ? "moon-waning-crescent" : "baby-bottle-outline";
  const closeGlyphStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const toggleGlyphStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));

  return (
    <Pressable onPress={onClose} style={styles.header}>
      <View style={styles.headerIcon}>
        <ActivityIcon name={icon} size={26} color={surface.icon} />
      </View>
      <ThemedText numberOfLines={1} style={[styles.title, { color: surface.label }]}>
        {t(`pro.${kind}`)}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("editor.cancel")}
        hitSlop={6}
        onPress={handleClosePress}
        style={[
          styles.closeButton,
          { backgroundColor: surface.control, borderColor: surface.controlBorder },
        ]}
      >
        <Animated.View style={[StyleSheet.absoluteFill, styles.closeGlyph, toggleGlyphStyle]}>
          <MaterialCommunityIcons
            name={running ? "stop" : "play"}
            size={20}
            color={surface.controlIcon}
            style={!running && styles.playGlyph}
          />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.closeGlyph, closeGlyphStyle]}>
          <MaterialCommunityIcons name="close" size={22} color={surface.controlIcon} />
        </Animated.View>
      </Pressable>
    </Pressable>
  );
}
