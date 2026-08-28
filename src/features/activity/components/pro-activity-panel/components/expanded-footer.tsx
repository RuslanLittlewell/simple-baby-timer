import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { useT } from "@/state/app-state";

import { withAlpha } from "../helpers";
import { styles } from "../styles";

interface ExpandedFooterProps {
  animatedStyle: StyleProp<ViewStyle>;
  color: string;
  disabled: boolean;
  canSave: boolean;
  saving: boolean;
  showBack: boolean;
  stopping: boolean;
  onBack: () => void;
  onPrimaryPress: () => void;
}

export function ExpandedFooter({
  animatedStyle,
  canSave,
  color,
  disabled,
  saving,
  showBack,
  stopping,
  onBack,
  onPrimaryPress,
}: ExpandedFooterProps) {
  const t = useT();
  const primaryDisabled = disabled || saving || (!stopping && !canSave);

  return (
    <Animated.View style={[styles.footer, animatedStyle]}>
      {showBack && (
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [
            styles.back,
            {
              borderColor: withAlpha(color, 0.34),
              backgroundColor: withAlpha(color, 0.1),
            },
            pressed && styles.pressed,
          ]}
        >
          <ThemedText style={[styles.backText, { color }]}>
            {t("pro.back")}
          </ThemedText>
        </Pressable>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy: saving, disabled: primaryDisabled }}
        disabled={primaryDisabled}
        onPress={onPrimaryPress}
        style={({ pressed }) => [
          styles.save,
          { borderColor: "rgba(255,255,255,0.82)", backgroundColor: "#FFFFFF" },
          primaryDisabled && styles.saveDisabled,
          pressed && styles.pressed,
        ]}
      >
        <ThemedText style={styles.saveText}>
          {t(stopping ? "pro.stop" : "editor.save")}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}
