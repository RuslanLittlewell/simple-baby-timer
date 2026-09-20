import { AuroraBackground } from "@/components/aurora-background";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useAppStore, useT } from "@/state/app-state";
import { useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AccountSection } from "./components/account-section";
import { AppearanceSection } from "./components/appearance-section";
import { DataSection } from "./components/data-section";
import { ReminderCard } from "./components/reminder-card";
import { SettingsSection } from "./components/settings-section";

type ReminderKind = "feeding" | "sleep" | "awake";

export default function SettingsScreen() {
  const sleepMinutes = useAppStore((s) => s.sleepMinutes);
  const awakeMinutes = useAppStore((s) => s.awakeMinutes);
  const feedingMinutes = useAppStore((s) => s.feedingMinutes);
  const sleepEnabled = useAppStore((s) => s.sleepNotificationsEnabled);
  const awakeEnabled = useAppStore((s) => s.awakeNotificationsEnabled);
  const feedingEnabled = useAppStore((s) => s.feedingNotificationsEnabled);
  const setSleepMinutes = useAppStore((s) => s.setSleepMinutes);
  const setAwakeMinutes = useAppStore((s) => s.setAwakeMinutes);
  const setFeedingMinutes = useAppStore((s) => s.setFeedingMinutes);
  const setNotificationsEnabled = useAppStore((s) => s.setNotificationsEnabled);
  const armedReminders = useAppStore((s) => s.armedReminders);
  const armReminder = useAppStore((s) => s.armReminder);
  const cancelArmedReminder = useAppStore((s) => s.cancelArmedReminder);
  const t = useT();
  const [expanded, setExpanded] = useState<Record<ReminderKind, boolean>>({
    feeding: feedingEnabled,
    sleep: sleepEnabled,
    awake: awakeEnabled,
  });
  const toggle = (kind: ReminderKind, enabled: boolean) =>
    setExpanded((current) => ({
      ...current,
      [kind]: enabled ? true : !current[kind],
    }));
  const updateReminder = (kind: ReminderKind, enabled: boolean) => {
    setExpanded((current) => ({ ...current, [kind]: enabled }));
    setNotificationsEnabled(kind, enabled);
  };

  return (
    <ThemedView gradient style={styles.container}>
      <AuroraBackground />
      <SafeAreaView
        style={[
          styles.safeArea,
          Platform.OS === "ios" && Platform.isPad && styles.ipadTopTabsInset,
        ]}
        edges={["top", "left", "right"]}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>
            <AppearanceSection />
            <SettingsSection title={t("settings.remindersSection")}>
              <View style={styles.reminderList}>
                <ReminderCard
                  label={t("settings.feedingTime")}
                  timeLabel={t("settings.remindAfter")}
                  hint={t("settings.feedingHint")}
                  icon="baby-bottle-outline"
                  value={feedingMinutes}
                  enabled={feedingEnabled}
                  expanded={feedingEnabled || expanded.feeding}
                  onToggle={() => toggle("feeding", feedingEnabled)}
                  armedUntil={armedReminders.feeding?.firesAt ?? null}
                  onEnabledChange={(value) => updateReminder("feeding", value)}
                  onArm={() => void armReminder("feeding")}
                  onDisarm={() => void cancelArmedReminder("feeding")}
                  onCommit={setFeedingMinutes}
                />
                <ReminderCard
                  label={t("settings.sleepTime")}
                  timeLabel={t("settings.remindAfter")}
                  hint={t("settings.sleepHint")}
                  icon="moon-waning-crescent"
                  value={sleepMinutes}
                  enabled={sleepEnabled}
                  expanded={sleepEnabled || expanded.sleep}
                  onToggle={() => toggle("sleep", sleepEnabled)}
                  armedUntil={armedReminders.sleep?.firesAt ?? null}
                  onEnabledChange={(value) => updateReminder("sleep", value)}
                  onArm={() => void armReminder("sleep")}
                  onDisarm={() => void cancelArmedReminder("sleep")}
                  onCommit={setSleepMinutes}
                />
                <ReminderCard
                  label={t("settings.awakeTime")}
                  timeLabel={t("settings.remindAfter")}
                  hint={t("settings.awakeHint")}
                  icon="white-balance-sunny"
                  value={awakeMinutes}
                  enabled={awakeEnabled}
                  expanded={awakeEnabled || expanded.awake}
                  onToggle={() => toggle("awake", awakeEnabled)}
                  armedUntil={armedReminders.awake?.firesAt ?? null}
                  onEnabledChange={(value) => updateReminder("awake", value)}
                  onArm={() => void armReminder("awake")}
                  onDisarm={() => void cancelArmedReminder("awake")}
                  onCommit={setAwakeMinutes}
                />
              </View>
            </SettingsSection>
            <DataSection />
            <AccountSection />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  ipadTopTabsInset: { paddingTop: 52 },
  scroll: { flex: 1, alignSelf: "stretch" },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    alignItems: "center",
  },
  inner: { width: "100%", maxWidth: MaxContentWidth, gap: Spacing.five },
  reminderList: { gap: Spacing.two },
});
