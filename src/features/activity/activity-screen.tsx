import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useIsFocused } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuroraBackground } from "@/components/aurora-background";
import { MobileMenu } from "@/components/mobile-menu";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { computeDayStats } from "@/features/calendar/helpers";
import { useActivityColors } from "@/hooks/use-activity-colors";
import { useProPaywall } from "@/hooks/use-pro-paywall";
import { useTheme } from "@/hooks/use-theme";
import { formatHm } from "@/i18n";
import {
  getSessionsForDay,
  type ActivitySession,
  type EventKind,
} from "@/lib/activity-store";
import { formatAge } from "@/lib/children";
import { useAppStore, useT } from "@/state/app-state";

import { ActivityRow } from "./components/activity-row";
import { DayStatsRow } from "./components/day-stats-row";
import { EventTile } from "./components/event-tile";
import { FloatingIcons } from "./components/floating-icons";
import { ProActivityPanel } from "./components/pro-activety-panel";
import { StatusCard } from "./components/status-card";
import { ACTIVITIES, EVENTS, FEEDING, MAIN_ACTIVITIES } from "./constants";

export default function ActivityScreen() {
  const theme = useTheme();
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
  const themeMode = useAppStore((state) => state.themeMode);
  const sleepMinutes = useAppStore((state) => state.sleepMinutes);
  const awakeMinutes = useAppStore((state) => state.awakeMinutes);
  const sleepNotificationsEnabled = useAppStore(
    (state) => state.sleepNotificationsEnabled,
  );
  const awakeNotificationsEnabled = useAppStore(
    (state) => state.awakeNotificationsEnabled,
  );
  const logEvent = useAppStore((state) => state.logEvent);
  const addManualActivity = useAppStore((state) => state.addManualActivity);
  const setActiveProDetails = useAppStore((state) => state.setActiveProDetails);
  const proActive = useAppStore((state) => state.proActive);
  const language = useAppStore((state) => state.language);
  const children = useAppStore((state) => state.children);
  const selectChild = useAppStore((state) => state.selectChild);
  const activeChildId = useAppStore((state) => state.activeChildId);
  const dataVersion = useAppStore((state) => state.dataVersion);
  const activeChild = children.find((child) => child.id === activeChildId);
  const proAccess = proActive || activeChild?.proEnabled === true;
  const t = useT();
  const focused = useIsFocused();
  const openPaywall = useProPaywall();
  const { float } = useActivityColors();
  const [nowTs, setNowTs] = useState(Date.now());
  const [panelWidth, setPanelWidth] = useState(1);
  const [panelIndex, setPanelIndex] = useState(proAccess ? 1 : 0);
  const [proExpanded, setProExpanded] = useState(false);
  const [proDismissSignal, setProDismissSignal] = useState(0);
  const [todaySessions, setTodaySessions] = useState<ActivitySession[]>([]);
  const pagerRef = useRef<ScrollView>(null);

  useEffect(() => {
    let alive = true;
    getSessionsForDay(new Date(), activeChildId).then((list) => {
      if (alive) setTodaySessions(list);
    });
    return () => {
      alive = false;
    };
  }, [activeChildId, dataVersion]);

  // Partner-run timers for the active child; hidden while a local timer of
  // the same track exists.
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

  // Without a child this screen has nothing to show and no way out: the header
  // chip that leads to the list is the child itself. Losing one — by switching
  // accounts, or deleting the last child — must not strand the user here. When
  // children exist but none is picked (the moment after landing here from the
  // index route), take the first rather than bouncing the user to the list.
  useEffect(() => {
    if (!focused || activeChild) return;
    const fallback = children[0];
    if (fallback) selectChild(fallback.id);
    else router.replace("/children");
  }, [focused, activeChild, children, selectChild, router]);

  const backToBasicPanel = useCallback(() => {
    setPanelIndex(0);
    pagerRef.current?.scrollTo({ x: 0, animated: true });
  }, []);

  // Swiping to the pro panel without access opens the paywall; closing it
  // without PRO slides back to the basic panel. The focus check matters: this
  // screen stays mounted behind the other tabs, and losing PRO elsewhere (by
  // deleting the account, say) would otherwise flash the paywall from here.
  useEffect(() => {
    if (!focused || proAccess || panelIndex !== 1) return;
    openPaywall((unlocked) => {
      if (!unlocked) backToBasicPanel();
    });
  }, [focused, panelIndex, proAccess, openPaywall, backToBasicPanel]);

  useEffect(() => {
    if (panelWidth <= 1) return;
    const targetIndex = proAccess ? 1 : 0;
    setPanelIndex(targetIndex);
    pagerRef.current?.scrollTo({
      x: targetIndex * panelWidth,
      animated: false,
    });
  }, [panelWidth, proAccess]);

  const secondsSince = (from: number) =>
    Math.max(0, Math.floor((nowTs - from) / 1000));

  const todayStartMs = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
  const todayEndMs = todayStartMs + 24 * 60 * 60 * 1000;
  const dayStats = computeDayStats(
    todaySessions,
    session,
    nowTs,
    todayStartMs,
    todayEndMs,
  );

  const primary = mainSession ?? feedingSession;
  const active = primary
    ? ACTIVITIES.find((a) => a.id === primary.kind)
    : undefined;
  const elapsed = primary ? secondsSince(primary.startedAt) : 0;
  const concurrentFeeding = !!(mainSession && feedingSession);
  const floatingKinds = active
    ? [
        { icon: active.icon, color: float[active.gradKey] },
        ...(concurrentFeeding && active.gradKey !== "feed"
          ? [{ icon: FEEDING.icon, color: float.feed }]
          : []),
      ]
    : [];
  // The note describes what the reminder will do, so it has nothing to say
  // while that reminder is switched off in settings.
  let statusNote = "";
  if (primary?.kind === "sleep" && sleepNotificationsEnabled)
    statusNote = t("activity.noteSleep", {
      time: formatHm(sleepMinutes, language),
    });
  else if (primary?.kind === "awake" && awakeNotificationsEnabled)
    statusNote = t("activity.noteAwake", {
      time: formatHm(awakeMinutes, language),
    });

  const childAge = activeChild?.birthday
    ? formatAge(activeChild.birthday, language)
    : null;

  const handlePanelTouch = () => {
    if (proExpanded) setProDismissSignal((value) => value + 1);
  };

  const handleMainActivity = async (kind: "settling" | "sleep" | "awake") => {
    if (activitySyncing) return;
    if (mainSession?.kind === kind) {
      // Stop whichever side runs it — ours or the partner's.
      if (session) await stopActivity(kind);
      else await stopRemoteActivity("session");
      return;
    }

    await transitionMainActivity(kind);
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
  ) => activitySyncing ? Promise.resolve() : transitionMainActivity(kind, details);

  const handleLogBottleFeeding = (startedAt: number) => {
    if (activitySyncing) return Promise.resolve();
    return addManualActivity(
      "feeding",
      startedAt,
      startedAt + 15 * 60_000,
      { type: "feeding", mode: "bottle" },
    );
  };

  const handleLogEvent = (kind: EventKind) => {
    if (activitySyncing) return;
    void logEvent(kind);
  };

  return (
    <ThemedView
      gradient
      style={styles.container}
      onTouchEnd={handlePanelTouch}
    >
      <AuroraBackground />
      {floatingKinds.length > 0 && <FloatingIcons kinds={floatingKinds} />}
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          {activeChild ? (
            <Pressable
              accessibilityLabel={activeChild.name}
              onPress={() => router.navigate("/children")}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <ThemedView type="backgroundElement" style={styles.childChip}>
                <MaterialCommunityIcons
                  name="baby-face-outline"
                  size={16}
                  color={theme.text}
                />
                <View style={styles.childInfo}>
                  <ThemedText
                    type="smallBold"
                    numberOfLines={1}
                    style={styles.childName}
                  >
                    {activeChild.name}
                  </ThemedText>
                  {childAge && (
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      numberOfLines={1}
                    >
                      {childAge}
                    </ThemedText>
                  )}
                </View>
              </ThemedView>
            </Pressable>
          ) : (
            <View />
          )}
          <MobileMenu />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Spacing.two}
          style={styles.center}
        >
          <DayStatsRow stats={dayStats} />

          <StatusCard
            primaryKind={primary?.kind ?? null}
            gradKey={active?.gradKey ?? null}
            elapsed={elapsed}
            statusNote={statusNote}
            feedingActive={concurrentFeeding}
          />

          <View
            style={styles.pager}
            onLayout={(event) => setPanelWidth(event.nativeEvent.layout.width)}
          >
            <ScrollView
              ref={pagerRef}
              horizontal
              pagingEnabled
              bounces={false}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) =>
                setPanelIndex(
                  Math.round(event.nativeEvent.contentOffset.x / panelWidth),
                )
              }
            >
              <View style={[styles.list, { width: panelWidth }]}>
                {MAIN_ACTIVITIES.map((activity) => {
                  const isActive = mainSession?.kind === activity.id;
                  return (
                    <ActivityRow
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
                      icon={FEEDING.icon}
                      gradKey={FEEDING.gradKey}
                      label={t("kind.feeding")}
                      isActive={!!feedingSession}
                      onPress={handleToggleFeeding}
                    />
                  </View>
                  <View style={styles.eventNarrow}>
                    <EventTile
                      icon={EVENTS[0].icon}
                      gradKey={EVENTS[0].gradKey}
                      accessibilityLabel={t(`kind.${EVENTS[0].id}`)}
                      onPress={() => handleLogEvent(EVENTS[0].id as EventKind)}
                    />
                  </View>
                  <View style={styles.eventNarrow}>
                    <EventTile
                      icon={EVENTS[1].icon}
                      gradKey={EVENTS[1].gradKey}
                      accessibilityLabel={t(`kind.${EVENTS[1].id}`)}
                      onPress={() => handleLogEvent(EVENTS[1].id as EventKind)}
                    />
                  </View>
                </View>
              </View>

              <View
                pointerEvents={proAccess ? "auto" : "none"}
                style={[styles.list, { width: panelWidth }]}
              >
                <ProActivityPanel
                  feedingActive={!!feedingSession}
                  settlingActive={mainSession?.kind === "settling"}
                  sleepActive={mainSession?.kind === "sleep"}
                  awakeActive={mainSession?.kind === "awake"}
                  dismissSignal={proDismissSignal}
                  onExpandedChange={setProExpanded}
                  onDetailsChange={setActiveProDetails}
                  onLogEvent={logEvent}
                  onLogBottleFeeding={handleLogBottleFeeding}
                  onSaveMainActivity={handleSaveMainActivity}
                  onToggleFeeding={handleToggleFeeding}
                  onToggleSettling={handleToggleSettling}
                  onToggleSleep={handleToggleSleep}
                  onToggleAwake={handleToggleAwake}
                />
              </View>
            </ScrollView>

            <View style={styles.pageIndicator}>
              {[0, 1].map((index) => (
                <View
                  key={index}
                  style={[
                    styles.pageDot,
                    panelIndex === index && styles.pageDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      {activitySyncing && (
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t("activity.syncing")}
          accessibilityState={{ busy: true }}
          style={styles.syncOverlay}
        >
          <BlurView
            experimentalBlurMethod="dimezisBlurView"
            intensity={45}
            tint={themeMode === "dark" ? "dark" : "light"}
            pointerEvents="none"
            style={[
              styles.syncBlur,
              {
                backgroundColor:
                  themeMode === "dark"
                    ? "rgba(11,18,32,0.28)"
                    : "rgba(245,247,251,0.24)",
              },
            ]}
          />
          <View
            style={[
              styles.syncLoader,
              {
                backgroundColor:
                  themeMode === "dark"
                    ? "rgba(21,30,43,0.78)"
                    : "rgba(255,255,255,0.76)",
              },
            ]}
          >
            <ActivityIndicator size="large" color={theme.text} />
            <ThemedText>{t("activity.syncing")}</ThemedText>
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  safeArea: {
    flex: 1,
    alignSelf: "stretch",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    width: "100%",
  },
  header: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.four,
  },
  childChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
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
  list: {
    gap: Spacing.two,
  },
  pager: {
    alignSelf: "stretch",
    gap: Spacing.three,
    position: "relative",
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
