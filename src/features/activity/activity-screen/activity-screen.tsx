import { useIsFocused } from "expo-router/react-navigation";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuroraBackground } from "@/components/aurora-background";
import { MobileMenu } from "@/components/mobile-menu";
import { SlimSwitch } from "@/components/slim-switch";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { computeDayStats } from "@/features/calendar/helpers";
import { BabySvg } from "@/features/children/components/baby-svg";
import {
  CHILD_GRADIENT_FG,
  CHILD_GRADIENTS,
} from "@/features/children/constants";
import { useTheme } from "@/hooks/use-theme";
import {
  getAllSessionsForChild,
  type ActivitySession,
  type EventKind,
  type ProDetails,
} from "@/lib/activity-store";
import { formatAge } from "@/lib/children";
import { latestGrowthMeasurement } from "@/lib/growth-measurements";
import { selectActiveChildProAccess } from "@/lib/pro-access";
import { useAppStore, useT } from "@/state/app-state";
import { useGrowthStore } from "@/state/growth-state";
import { GrowthHistoryModal } from "@/features/growth/growth-history-modal";
import { GrowthSummary } from "@/features/growth/growth-summary";

import { activitySyncPresentation } from "../activity-sync-presentation";
import { ActivityActionsSyncLoader } from "../components/activity-sync-loader/activity-actions-sync-loader";
import { ActivityRow } from "../components/activity-row";
import { DayStatsRow } from "../components/day-stats/day-stats-row";
import { EventTile } from "../components/event-tile";
import { ProActivityPanel } from "../components/pro-activity-panel/pro-activity-panel";
import { StartTimePicker } from "../components/start-time-picker";
import { StatusCard } from "../components/status-card";
import { ACTIVITIES, EVENTS, FEEDING, MAIN_ACTIVITIES } from "../constants";
import { styles } from "./styles";



interface PendingStart {
  kind: "settling" | "sleep" | "awake";
  details?: ProDetails;
}

export default function ActivityScreen() {
  const router = useRouter();
  const session = useAppStore((state) => state.session);
  const feeding = useAppStore((state) => state.feeding);
  const remoteLive = useAppStore((state) => state.remoteLive);
  const startActivity = useAppStore((state) => state.startActivity);
  const stopActivity = useAppStore((state) => state.stopActivity);
  const stopRemoteActivity = useAppStore((state) => state.stopRemoteActivity);
  const transitionMainActivity = useAppStore((state) => state.transitionMainActivity);
  const activitySyncing = useAppStore(
    (state) => state.activitySyncStatus === "syncing",
  );
  const syncPresentation = activitySyncPresentation(activitySyncing);
  const logEvent = useAppStore((state) => state.logEvent);
  const addManualActivity = useAppStore((state) => state.addManualActivity);
  const setActiveProDetails = useAppStore((state) => state.setActiveProDetails);
  const proAccess = useAppStore(selectActiveChildProAccess);
  const simpleActivityMode = useAppStore((state) => state.simpleActivityMode);
  const setSimpleActivityMode = useAppStore((state) => state.setSimpleActivityMode);
  const language = useAppStore((state) => state.language);
  const children = useAppStore((state) => state.children);
  const selectChild = useAppStore((state) => state.selectChild);
  const activeChildId = useAppStore((state) => state.activeChildId);
  const dataVersion = useAppStore((state) => state.dataVersion);
  const activeChild = children.find((child) => child.id === activeChildId);
  const t = useT();
  const focused = useIsFocused();
  const theme = useTheme();
  const [nowTs, setNowTs] = useState(Date.now());
  const [proExpanded, setProExpanded] = useState(false);
  const [proDismissSignal, setProDismissSignal] = useState(0);
  const [childSessions, setChildSessions] = useState<ActivitySession[]>([]);
  const [pendingStart, setPendingStart] = useState<PendingStart | null>(null);
  const [growthHistoryOpen, setGrowthHistoryOpen] = useState(false);
  const growthMeasurements = useGrowthStore((state) => state.measurements);
  
  
  const pendingStartResolve = useRef<((started: boolean) => void) | null>(null);

  useEffect(() => {
    let alive = true;
    if (!activeChildId) {
      setChildSessions([]);
      return;
    }
    getAllSessionsForChild(activeChildId).then((list) => {
      if (alive) setChildSessions(list);
    });
    return () => {
      alive = false;
    };
  }, [activeChildId, dataVersion]);

  
  
  const remoteMain = session
    ? null
    : (remoteLive.find(
        (item) => item.childId === activeChildId && item.track === "session",
      ) ?? null);
  const remoteFeeding = feeding
    ? null
    : (remoteLive.find(
        (item) => item.childId === activeChildId && item.track === "feeding",
      ) ?? null);

  const mainSession =
    session ??
    (remoteMain
      ? { kind: remoteMain.kind, startedAt: remoteMain.startedAt }
      : null);
  const feedingSession =
    feeding ??
    (remoteFeeding
      ? { kind: remoteFeeding.kind, startedAt: remoteFeeding.startedAt }
      : null);

  useEffect(() => {
    if (!mainSession && !feedingSession) return;
    setNowTs(Date.now());
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [mainSession?.startedAt, feedingSession?.startedAt]);

  
  
  
  
  
  useEffect(() => {
    if (!focused || activeChild) return;
    const fallback = children[0];
    if (fallback) selectChild(fallback.id);
    else router.replace("/children");
  }, [focused, activeChild, children, selectChild, router]);

  const secondsSince = (from: number) =>
    Math.max(0, Math.floor((nowTs - from) / 1000));

  const todayStartMs = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
  const todayEndMs = todayStartMs + 24 * 60 * 60 * 1000;
  const dayStats = computeDayStats(
    childSessions,
    session,
    nowTs,
    todayStartMs,
    todayEndMs,
    feedingSession?.startedAt,
    true,
  );

  const primary = mainSession ?? feedingSession;
  const active = primary
    ? ACTIVITIES.find((a) => a.id === primary.kind)
    : undefined;
  const elapsed = primary ? secondsSince(primary.startedAt) : 0;
  const concurrentFeeding = !!(mainSession && feedingSession);

  const childAge = activeChild?.birthday
    ? formatAge(activeChild.birthday, language)
    : null;
  const latestGrowth = latestGrowthMeasurement(
    growthMeasurements.filter((measurement) => measurement.childId === activeChildId),
  );

  const handlePanelTouch = () => {
    if (proExpanded) setProDismissSignal((value) => value + 1);
  };

  const handleMainActivity = async (kind: "settling" | "sleep" | "awake") => {
    if (activitySyncing) return;
    if (mainSession?.kind === kind) {
      
      if (session) await stopActivity(kind);
      else await stopRemoteActivity("session");
      return;
    }

    
    setPendingStart({ kind });
  };

  const handleToggleFeeding = async () => {
    if (activitySyncing) return;
    if (feeding) await stopActivity("feeding");
    else if (remoteFeeding) await stopRemoteActivity("feeding");
    else await startActivity("feeding");
  };

  const handleToggleSettling = () => handleMainActivity("settling");
  const handleToggleSleep = () => handleMainActivity("sleep");
  const handleToggleAwake = () => handleMainActivity("awake");
  const handleSaveMainActivity = (
    kind: "settling" | "sleep",
    details: Parameters<typeof transitionMainActivity>[1],
  ) => {
    if (activitySyncing) return Promise.resolve(false);
    return new Promise<boolean>((resolve) => {
      pendingStartResolve.current = resolve;
      setPendingStart({ kind, details });
    });
  };

  const settlePendingStart = (started: boolean) => {
    const resolve = pendingStartResolve.current;
    pendingStartResolve.current = null;
    resolve?.(started);
  };

  const confirmPendingStart = async (startedAt: number) => {
    const pending = pendingStart;
    setPendingStart(null);
    
    
    if (!pending || activitySyncing) {
      settlePendingStart(false);
      return;
    }
    await transitionMainActivity(pending.kind, pending.details, startedAt);
    settlePendingStart(true);
  };

  const dismissPendingStart = () => {
    setPendingStart(null);
    settlePendingStart(false);
  };

  const handleLogBottleFeeding = (
    startedAt: number,
    content: "formula" | "breastMilk",
    volumeMl?: number,
  ) => {
    if (activitySyncing) return Promise.resolve();
    return addManualActivity(
      "feeding",
      startedAt,
      startedAt + 15 * 60_000,
      { type: "feeding", mode: "bottle", content, volumeMl },
      volumeMl,
    );
  };

  const handleLogEvent = (kind: EventKind) => {
    if (activitySyncing) return;
    void logEvent(kind);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.screen }]}
      onTouchEnd={handlePanelTouch}
    >
      <AuroraBackground opacity={0.5} />
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Spacing.two}
          style={styles.keyboard}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              {activeChild ? (
                <View style={styles.profileStack}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      childAge ? `${activeChild.name}, ${childAge}` : activeChild.name
                    }
                    onPress={() => router.navigate("/children")}
                    style={({ pressed }) => [styles.profile, pressed && styles.pressed]}
                  >
                    <LinearGradient
                      colors={CHILD_GRADIENTS[activeChild.gradientKey]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.avatar}
                    >
                      <BabySvg
                        size={34}
                        faceColor={CHILD_GRADIENT_FG[activeChild.gradientKey]}
                        featureColor={CHILD_GRADIENTS[activeChild.gradientKey][1]}
                      />
                    </LinearGradient>
                    <View style={styles.profileText}>
                      <ThemedText numberOfLines={1} style={styles.childName}>
                        {activeChild.name}
                      </ThemedText>
                      {childAge && (
                        <ThemedText
                          numberOfLines={2}
                          themeColor="textMuted"
                          style={styles.childAge}
                        >
                          {childAge}
                        </ThemedText>
                      )}
                    </View>
                  </Pressable>
                  <GrowthSummary
                    measurement={latestGrowth}
                    onPress={() => setGrowthHistoryOpen(true)}
                  />
                </View>
              ) : (
                <View />
              )}
              <View style={styles.menuSlot}>
                <MobileMenu />
              </View>
            </View>

            <StatusCard
              primaryKind={primary?.kind ?? null}
              gradKey={active?.gradKey ?? null}
              elapsed={elapsed}
              startedAt={primary?.startedAt ?? null}
              feedingActive={concurrentFeeding}
            />

            <DayStatsRow stats={dayStats} />

            <View style={styles.sectionHeader}>
              <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
                {t("activity.track")}
              </ThemedText>
              {proAccess && (
                <SlimSwitch
                  value={simpleActivityMode}
                  label={t("activity.simple")}
                  labelColor={theme.textMuted}
                  activeColor={theme.statusAccent}
                  inactiveColor={theme.backgroundSelected}
                  onValueChange={setSimpleActivityMode}
                />
              )}
            </View>

            <View style={styles.activityActionsRegion}>
              <ActivityActionsSyncLoader
                accessibilityLabel={t("activity.syncing")}
                visible={syncPresentation.showHeaderIndicator}
              />
              {proAccess ? (
                <View style={styles.list}>
                <ProActivityPanel
                  disabled={syncPresentation.activityActionsDisabled}
                  simple={simpleActivityMode}
                  feedingActive={!!feedingSession}
                  settlingActive={mainSession?.kind === "settling"}
                  sleepActive={mainSession?.kind === "sleep"}
                  awakeActive={mainSession?.kind === "awake"}
                  dismissSignal={proDismissSignal}
                  onExpandedChange={setProExpanded}
                  onDetailsChange={setActiveProDetails}
                  onLogEvent={handleLogEvent}
                  onLogBottleFeeding={handleLogBottleFeeding}
                  onSaveMainActivity={handleSaveMainActivity}
                  onToggleFeeding={handleToggleFeeding}
                  onToggleSettling={handleToggleSettling}
                  onToggleSleep={handleToggleSleep}
                  onToggleAwake={handleToggleAwake}
                />
                </View>
              ) : (
                <View style={styles.list}>
                  {MAIN_ACTIVITIES.map((activity) => {
                    const isActive = mainSession?.kind === activity.id;
                    return (
                      <ActivityRow
                        disabled={syncPresentation.activityActionsDisabled}
                        key={activity.id}
                        icon={activity.icon}
                        gradKey={activity.gradKey}
                        label={t(`kind.${activity.id}`)}
                        isActive={isActive}
                        onPress={() => handleMainActivity(activity.id)}
                      />
                    );
                  })}

                  <View style={styles.eventRow}>
                    <View style={styles.eventWide}>
                      <ActivityRow
                        disabled={syncPresentation.activityActionsDisabled}
                        icon={FEEDING.icon}
                        gradKey={FEEDING.gradKey}
                        label={t("kind.feeding")}
                        isActive={!!feedingSession}
                        onPress={handleToggleFeeding}
                      />
                    </View>
                    <View style={styles.eventNarrow}>
                      <EventTile
                        disabled={syncPresentation.activityActionsDisabled}
                        icon={EVENTS[0].icon}
                        gradKey={EVENTS[0].gradKey}
                        accessibilityLabel={t(`kind.${EVENTS[0].id}`)}
                        onPress={() => handleLogEvent(EVENTS[0].id as EventKind)}
                      />
                    </View>
                    <View style={styles.eventNarrow}>
                      <EventTile
                        disabled={syncPresentation.activityActionsDisabled}
                        icon={EVENTS[1].icon}
                        gradKey={EVENTS[1].gradKey}
                        accessibilityLabel={t(`kind.${EVENTS[1].id}`)}
                        onPress={() => handleLogEvent(EVENTS[1].id as EventKind)}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      {pendingStart && (
        <StartTimePicker
          runningStartedAt={mainSession?.startedAt}
          onConfirm={(startedAt) => void confirmPendingStart(startedAt)}
          onDismiss={dismissPendingStart}
        />
      )}
      <GrowthHistoryModal
        visible={growthHistoryOpen}
        child={activeChild ?? null}
        onClose={() => setGrowthHistoryOpen(false)}
      />
    </View>
  );
}
