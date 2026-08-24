import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { SelectField } from "@/components/select-field";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { LANGUAGES } from "@/i18n";
import { signOut } from "@/lib/supabase";
import { useAppStore, useT } from "@/state/app-state";

const DRAWER_WIDTH = Dimensions.get("window").width * 0.5;

export function MobileMenu() {
  const theme = useTheme();
  const t = useT();

  const insets = useSafeAreaInsets();
  const fallback = initialWindowMetrics?.insets;
  const safeArea = {
    paddingTop: Spacing.three + (insets.top || fallback?.top || 0),
    paddingBottom: Spacing.three + (insets.bottom || fallback?.bottom || 0),
    paddingLeft: Spacing.three + (insets.left || fallback?.left || 0),
    paddingRight: Spacing.three + (insets.right || fallback?.right || 0),
  };
  const language = useAppStore((state) => state.language);
  const themeMode = useAppStore((state) => state.themeMode);
  const proActive = useAppStore((state) => state.proActive);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const setThemeMode = useAppStore((state) => state.setThemeMode);

  const setPendingPaywall = useAppStore((state) => state.setPendingPaywall);
  const [visible, setVisible] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const currentLanguage =
    LANGUAGES.find((item) => item.code === language) ?? LANGUAGES[0];
  const drawerX = useSharedValue(DRAWER_WIDTH);

  useEffect(() => {
    if (!visible) return;
    drawerX.value = DRAWER_WIDTH;
    drawerX.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [drawerX, visible]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drawerX.value }],
  }));

  const close = (after?: () => void) => {
    setLangOpen(false);
    const finish = () => {
      setVisible(false);
      after?.();
    };
    drawerX.value = withTiming(
      DRAWER_WIDTH,
      { duration: 240, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(finish)();
      },
    );
  };

  const confirmLogout = () =>
    close(() =>
      Alert.alert(t("menu.logoutConfirm"), undefined, [
        { text: t("editor.cancel"), style: "cancel" },
        {
          text: t("menu.logout"),
          style: "destructive",

          onPress: () => void signOut(),
        },
      ]),
    );

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setVisible(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
      >
        {proActive && (
          <LinearGradient
            colors={["#4C1D95", "#7C3AED", "#C026D3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.proBadge}
          >
            <ThemedText style={styles.proBadgeText}>Premium</ThemedText>
          </LinearGradient>
        )}
        <MaterialCommunityIcons name="menu" size={28} color={theme.text} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={() => close()}
      >
        <View style={styles.modal}>
          <Pressable style={styles.overlay} onPress={() => close()} />
          <Animated.View
            style={[
              styles.drawer,
              { width: DRAWER_WIDTH, backgroundColor: theme.background },
              drawerStyle,
            ]}
          >
            <View style={[styles.safe, safeArea]}>
              <View style={styles.drawerHeader}>
                <ThemedText type="smallBold">{t("settings.title")}</ThemedText>
                <Pressable onPress={() => close()} hitSlop={10}>
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={theme.text}
                  />
                </Pressable>
              </View>

              <View style={[styles.section, langOpen && styles.sectionOpen]}>
                <ThemedText type="small" themeColor="textSecondary">
                  {t("settings.language")}
                </ThemedText>
                <SelectField
                  value={currentLanguage.label}
                  selectedValue={language}
                  options={LANGUAGES.map((item) => ({
                    value: item.code,
                    label: item.label,
                  }))}
                  onSelect={(code) => setLanguage(code as typeof language)}
                  open={langOpen}
                  onOpenChange={setLangOpen}
                />
              </View>

              <View style={styles.section}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => close(() => setPendingPaywall(true))}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="star-circle-outline"
                    size={18}
                    color={theme.text}
                  />
                  <ThemedText type="smallBold" style={styles.rowLabel}>
                    {t("menu.subscriptions")}
                  </ThemedText>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={18}
                    color={theme.textSecondary}
                  />
                </Pressable>
              </View>

              <View style={styles.section}>
                <View style={styles.themeRow}>
                  <View style={styles.themeLabel}>
                    <MaterialCommunityIcons
                      name={
                        themeMode === "dark"
                          ? "weather-night"
                          : "white-balance-sunny"
                      }
                      size={18}
                      color={theme.text}
                    />
                    <ThemedText type="smallBold">
                      {t("settings.theme")}
                    </ThemedText>
                  </View>
                  <Switch
                    accessibilityLabel={t("settings.theme")}
                    value={themeMode === "light"}
                    onValueChange={(isLight) =>
                      setThemeMode(isLight ? "light" : "dark")
                    }
                    trackColor={{ false: theme.border, true: "#C4B5FD" }}
                    style={themeMode === "light" && styles.lightSwitchBorder}
                  />
                </View>
              </View>

              <View style={styles.footer}>
                <Pressable
                  accessibilityRole="button"
                  onPress={confirmLogout}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="logout"
                    size={18}
                    color={theme.text}
                  />
                  <ThemedText type="smallBold" style={styles.rowLabel}>
                    {t("menu.logout")}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  proBadge: {
    minWidth: 72,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.42)",
    paddingHorizontal: Spacing.two,
    overflow: "hidden",
    shadowColor: "#6D4BD1",
    shadowOpacity: 0.24,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  proBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  modal: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    borderTopLeftRadius: Spacing.four,
    borderBottomLeftRadius: Spacing.four,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: -6, height: 0 },
    elevation: 18,
  },
  safe: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: Spacing.three,
  },
  section: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  sectionOpen: {
    zIndex: 9999,
    elevation: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    minHeight: 32,
  },
  rowLabel: {
    flex: 1,
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  themeLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  lightSwitchBorder: {
    borderRadius: 16,
    boxShadow: "inset 0 0 0 2px #C4B5FD",
  },
  footer: {
    flex: 1,
    justifyContent: "flex-end",
    gap: Spacing.four,
    paddingBottom: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
