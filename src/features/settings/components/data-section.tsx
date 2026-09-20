import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { ActivityActionsSyncLoader } from "@/features/activity/components/activity-sync-loader/activity-actions-sync-loader";
import { fmtTime, pad2 } from "@/features/calendar/helpers";
import { useProPaywall } from "@/hooks/use-pro-paywall";
import { useTheme } from "@/hooks/use-theme";
import { PERSONAL_REGIME_MIN_CLEAN_DAYS } from "@/lib/personal-regime";
import { selectActiveChildProAccess } from "@/lib/pro-access";
import { useAppStore, useT } from "@/state/app-state";
import { usePersonalRegimeStore } from "@/state/personal-regime-state";

import {
  isPersonalRegimeAvailable,
  recalculatePersonalRegime,
  syncChildData,
} from "../data-actions";
import { SettingsSection } from "./settings-section";

type DataAction = "sync" | "regime";

interface DataActionCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  hint: string;
  busy: boolean;
  disabled: boolean;
  busyLabel: string;
  onPress: () => void;
}

function DataActionCard({
  icon,
  label,
  hint,
  busy,
  disabled,
  busyLabel,
  onPress,
}: DataActionCardProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.content,
          disabled && styles.disabled,
          busy && styles.busy,
        ]}
      >
        <MaterialCommunityIcons name={icon} size={30} color={theme.text} />
        <View style={styles.flex}>
          <ThemedText type="smallBold">{label}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {hint}
          </ThemedText>
        </View>
      </View>
      <ActivityActionsSyncLoader
        accessibilityLabel={busyLabel}
        visible={busy}
      />
    </Pressable>
  );
}

export function DataSection() {
  const t = useT();
  const children = useAppStore((s) => s.children);
  const activeChildId = useAppStore((s) => s.activeChildId);
  const dataVersion = useAppStore((s) => s.dataVersion);
  const proAccess = useAppStore(selectActiveChildProAccess);
  const openPaywall = useProPaywall();
  const activeChild = children.find((child) => child.id === activeChildId);
  const regime = usePersonalRegimeStore((s) =>
    activeChildId ? s.regimes[activeChildId] : undefined,
  );
  const [busy, setBusy] = useState<DataAction | null>(null);
  const [regimeAvailable, setRegimeAvailable] = useState(false);
  const [syncedAt, setSyncedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!activeChild) {
      setRegimeAvailable(false);
      return;
    }
    let alive = true;
    void isPersonalRegimeAvailable(activeChild).then((available) => {
      if (alive) setRegimeAvailable(available);
    });
    return () => {
      alive = false;
    };
  }, [activeChild, dataVersion]);

  if (!activeChild) return null;

  const sync = () => {
    if (busy) return;
    setBusy("sync");
    void syncChildData(activeChild)
      .then(() => setSyncedAt(Date.now()))
      .catch(() => Alert.alert(t("settings.syncDataError")))
      .finally(() => setBusy(null));
  };
  const runRecalculation = () => {
    setBusy("regime");
    void recalculatePersonalRegime(activeChild)
      .then((result) => {
        if (!result.ok)
          Alert.alert(
            t("settings.recalculateRegime"),
            t("settings.recalculateRegimeNotEnough", {
              days: result.cleanDays,
              required: PERSONAL_REGIME_MIN_CLEAN_DAYS,
            }),
          );
      })
      .catch(() => Alert.alert(t("settings.recalculateRegimeError")))
      .finally(() => setBusy(null));
  };
  const recalculate = () => {
    if (busy || !regimeAvailable) return;
    if (proAccess) {
      runRecalculation();
      return;
    }
    openPaywall((unlocked) => {
      if (unlocked) runRecalculation();
    });
  };

  const computedAt = regime ? new Date(regime.computedAt) : null;
  const regimeHint = !regimeAvailable
    ? t("settings.recalculateRegimeLocked")
    : regime && computedAt
      ? t("settings.recalculateRegimeReady", {
          days: regime.basedOnDays,
          date: `${pad2(computedAt.getDate())}.${pad2(computedAt.getMonth() + 1)}`,
        })
      : t("settings.recalculateRegimeHint");

  return (
    <SettingsSection title={t("settings.dataSection")}>
      <View style={styles.list}>
        <DataActionCard
          icon="cloud-sync-outline"
          label={t("settings.syncData")}
          hint={
            syncedAt
              ? t("settings.syncDataDone", { time: fmtTime(syncedAt) })
              : t("settings.syncDataHint")
          }
          busy={busy === "sync"}
          disabled={busy === "regime"}
          busyLabel={t("settings.syncData")}
          onPress={sync}
        />
        <DataActionCard
          icon="creation"
          label={t("settings.recalculateRegime")}
          hint={regimeHint}
          busy={busy === "regime"}
          disabled={!regimeAvailable || busy === "sync"}
          busyLabel={t("settings.recalculateRegime")}
          onPress={recalculate}
        />
      </View>
    </SettingsSection>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  card: {
    minHeight: 76,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    justifyContent: "center",
  },
  content: { flexDirection: "row", alignItems: "center", gap: Spacing.three },
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.45 },
  busy: { opacity: 0.2 },
});
