import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MobileMenu } from '@/components/mobile-menu';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { computeDayStats } from '@/features/calendar/helpers';
import { useActivityColors } from '@/hooks/use-activity-colors';
import { useTheme } from '@/hooks/use-theme';
import { formatHm } from '@/i18n';
import { getSessionsForDay, type ActivitySession, type EventKind } from '@/lib/activity-store';
import { formatAge } from '@/lib/children';
import { useAppStore, useT } from '@/state/app-state';

import { ActivityRow } from './components/activity-row';
import { DayStatsRow } from './components/day-stats-row';
import { EventTile } from './components/event-tile';
import { FloatingIcons } from './components/floating-icons';
import { ProActivityPanel } from './components/pro-activety-panel';
import { StatusCard } from './components/status-card';
import { ACTIVITIES, EVENTS, FEEDING, MAIN_ACTIVITIES } from './constants';

export default function ActivityScreen() {
  const theme = useTheme();
  const router = useRouter();
  const session = useAppStore((state) => state.session);
  const feeding = useAppStore((state) => state.feeding);
  const remoteLive = useAppStore((state) => state.remoteLive);
  const startActivity = useAppStore((state) => state.startActivity);
  const stopActivity = useAppStore((state) => state.stopActivity);
  const stopRemoteActivity = useAppStore((state) => state.stopRemoteActivity);
  const sleepMinutes = useAppStore((state) => state.sleepMinutes);
  const awakeMinutes = useAppStore((state) => state.awakeMinutes);
  const feedingMinutes = useAppStore((state) => state.feedingMinutes);
  const logEvent = useAppStore((state) => state.logEvent);
  const setActiveProDetails = useAppStore((state) => state.setActiveProDetails);
  const proActive = useAppStore((state) => state.proActive);
  const activateTestPro = useAppStore((state) => state.activateTestPro);
  const language = useAppStore((state) => state.language);
  const children = useAppStore((state) => state.children);
  const activeChildId = useAppStore((state) => state.activeChildId);
  const dataVersion = useAppStore((state) => state.dataVersion);
  const activeChild = children.find((child) => child.id === activeChildId);
  const proAccess = proActive || activeChild?.proEnabled === true;
  const t = useT();
  const { accent } = useActivityColors();
  const [nowTs, setNowTs] = useState(Date.now());
  const [panelWidth, setPanelWidth] = useState(1);
  const [panelIndex, setPanelIndex] = useState(proAccess ? 1 : 0);
  const [proExpanded, setProExpanded] = useState(false);
  const [proDismissSignal, setProDismissSignal] = useState(0);
  const [proPaywallVisible, setProPaywallVisible] = useState(false);
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
        (item) => item.childId === activeChildId && item.track === 'session',
      ) ?? null);
  const remoteFeeding = feeding
    ? null
    : (remoteLive.find(
        (item) => item.childId === activeChildId && item.track === 'feeding',
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
    if (proAccess || panelIndex !== 1) {
      setProPaywallVisible(false);
      return;
    }
    setProPaywallVisible(true);
  }, [panelIndex, proAccess]);

  useEffect(() => {
    if (panelWidth <= 1) return;
    const targetIndex = proAccess ? 1 : 0;
    setPanelIndex(targetIndex);
    pagerRef.current?.scrollTo({ x: targetIndex * panelWidth, animated: false });
  }, [panelWidth, proAccess]);

  const closeProPreview = () => {
    setProPaywallVisible(false);
    setPanelIndex(0);
    pagerRef.current?.scrollTo({ x: 0, animated: true });
  };

  const secondsSince = (from: number) => Math.max(0, Math.floor((nowTs - from) / 1000));

  const todayStartMs = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
  const todayEndMs = todayStartMs + 24 * 60 * 60 * 1000;
  const dayStats = computeDayStats(todaySessions, session, nowTs, todayStartMs, todayEndMs);

  const primary = mainSession ?? feedingSession;
  const active = primary ? ACTIVITIES.find((a) => a.id === primary.kind) : undefined;
  const elapsed = primary ? secondsSince(primary.startedAt) : 0;
  const concurrentFeeding = !!(mainSession && feedingSession);
  const floatingKinds = active
    ? [
        { icon: active.icon, color: accent[active.gradKey] },
        ...(concurrentFeeding && active.gradKey !== 'feed'
          ? [{ icon: FEEDING.icon, color: accent.feed }]
          : []),
      ]
    : [];
  let statusNote = '';
  if (primary?.kind === 'sleep')
    statusNote = t('activity.noteSleep', { time: formatHm(sleepMinutes, language) });
  else if (primary?.kind === 'awake')
    statusNote = t('activity.noteAwake', { time: formatHm(awakeMinutes, language) });
  else if (primary?.kind === 'feeding')
    statusNote = t('activity.noteFeeding', { n: feedingMinutes });

  const childAge = activeChild?.birthday ? formatAge(activeChild.birthday, language) : null;

  return (
    <ThemedView
      gradient
      style={styles.container}
      onTouchEnd={() => {
        if (proExpanded) setProDismissSignal((value) => value + 1);
      }}>
      {floatingKinds.length > 0 && <FloatingIcons kinds={floatingKinds} />}
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          {activeChild ? (
            <Pressable
              accessibilityLabel={activeChild.name}
              onPress={() => router.navigate('/')}
              style={({ pressed }) => [pressed && styles.pressed]}>
              <ThemedView type="backgroundElement" style={styles.childChip}>
                <MaterialCommunityIcons
                  name="baby-face-outline"
                  size={16}
                  color={theme.text}
                />
                <View style={styles.childInfo}>
                  <ThemedText type="smallBold" numberOfLines={1} style={styles.childName}>
                    {activeChild.name}
                  </ThemedText>
                  {childAge && (
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
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
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Spacing.two}
          style={styles.center}>
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
            onLayout={(event) => setPanelWidth(event.nativeEvent.layout.width)}>
            <ScrollView
              ref={pagerRef}
              horizontal
              pagingEnabled
              bounces={false}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) =>
                setPanelIndex(Math.round(event.nativeEvent.contentOffset.x / panelWidth))
              }>
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
                  onPress={async () => {
                        if (isActive) {
                          // Stop whichever side runs it — ours or the partner's.
                          if (session) stopActivity(activity.id);
                          else await stopRemoteActivity('session');
                          return;
                        }
                        // Switching over a partner-run timer: close it first so
                        // its record is saved, then start ours.
                        if (remoteMain) await stopRemoteActivity('session');
                        startActivity(activity.id);
                      }}
                    />
                  );
                })}

                <View style={styles.eventRow}>
                  <View style={styles.eventWide}>
                    <ActivityRow
                      icon={FEEDING.icon}
                      gradKey={FEEDING.gradKey}
                      label={t('kind.feeding')}
                      isActive={!!feedingSession}
                      onPress={() => {
                        if (feeding) stopActivity('feeding');
                        else if (remoteFeeding) stopRemoteActivity('feeding');
                        else startActivity('feeding');
                      }}
                    />
                  </View>
                  <View style={styles.eventNarrow}>
                    <EventTile
                      icon={EVENTS[0].icon}
                      gradKey={EVENTS[0].gradKey}
                      accessibilityLabel={t(`kind.${EVENTS[0].id}`)}
                      onPress={() => logEvent(EVENTS[0].id as EventKind)}
                    />
                  </View>
                  <View style={styles.eventNarrow}>
                    <EventTile
                      icon={EVENTS[1].icon}
                      gradKey={EVENTS[1].gradKey}
                      accessibilityLabel={t(`kind.${EVENTS[1].id}`)}
                      onPress={() => logEvent(EVENTS[1].id as EventKind)}
                    />
                  </View>
                </View>
              </View>

              <View
                pointerEvents={proAccess ? 'auto' : 'none'}
                style={[styles.list, { width: panelWidth }]}>
                  <ProActivityPanel
                  feedingActive={!!feedingSession}
                  settlingActive={mainSession?.kind === 'settling'}
                  sleepActive={mainSession?.kind === 'sleep'}
                  awakeActive={mainSession?.kind === 'awake'}
                  dismissSignal={proDismissSignal}
                  onExpandedChange={setProExpanded}
                  onDetailsChange={setActiveProDetails}
                  onLogEvent={logEvent}
                  onToggleFeeding={async () => {
                    if (feeding) await stopActivity('feeding');
                    else if (remoteFeeding) await stopRemoteActivity('feeding');
                    else await startActivity('feeding');
                  }}
                  onToggleSettling={async () => {
                    if (mainSession?.kind === 'settling') {
                      if (session) await stopActivity('settling');
                      else await stopRemoteActivity('session');
                      return;
                    }
                    if (remoteMain) await stopRemoteActivity('session');
                    await startActivity('settling');
                  }}
                  onToggleSleep={async () => {
                    if (mainSession?.kind === 'sleep') {
                      if (session) await stopActivity('sleep');
                      else await stopRemoteActivity('session');
                      return;
                    }
                    if (remoteMain) await stopRemoteActivity('session');
                    await startActivity('sleep');
                  }}
                  onToggleAwake={async () => {
                    if (mainSession?.kind === 'awake') {
                      if (session) await stopActivity('awake');
                      else await stopRemoteActivity('session');
                      return;
                    }
                    // startActivity atomically finalizes a local sleep session
                    // before replacing it with awake. Remote sessions must be
                    // closed explicitly first.
                    if (remoteMain) await stopRemoteActivity('session');
                    await startActivity('awake');
                  }}
                  />
              </View>
            </ScrollView>

            <Modal
              visible={proPaywallVisible}
              transparent
              animationType="fade"
              onRequestClose={closeProPreview}>
              <View style={styles.proPaywall}>
                <View style={[styles.proPaywallCard, { backgroundColor: theme.backgroundElement }]}>
                  <Pressable
                    accessibilityLabel={t('editor.cancel')}
                    onPress={closeProPreview}
                    hitSlop={12}
                    style={styles.proPaywallClose}>
                    <MaterialCommunityIcons name="close" size={24} color={theme.text} />
                  </Pressable>
                  <MaterialCommunityIcons name="lock-outline" size={34} color="#C4B5FD" />
                  <ThemedText style={styles.proPaywallTitle}>{t('proPaywall.title')}</ThemedText>
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    style={styles.proPaywallText}>
                    {t('proPaywall.body')}
                  </ThemedText>
                  <Pressable
                    onPress={() =>
                      void activateTestPro()
                        .then(() => setProPaywallVisible(false))
                        .catch(() => {})
                    }
                    style={({ pressed }) => [
                      styles.proPaywallBuy,
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="smallBold">{t('menu.buyPro')}</ThemedText>
                  </Pressable>
                </View>
              </View>
            </Modal>

            <View style={styles.pageIndicator}>
              {[0, 1].map((index) => (
                <View
                  key={index}
                  style={[styles.pageDot, panelIndex === index && styles.pageDotActive]}
                />
              ))}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  header: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.four,
  },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  childInfo: {
    maxWidth: 190,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  childName: {
    flexShrink: 1,
  },
  center: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: Spacing.five,
  },
  list: {
    gap: Spacing.two,
  },
  pager: {
    alignSelf: 'stretch',
    gap: Spacing.three,
    position: 'relative',
  },
  pageIndicator: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: Spacing.two,
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  pageDotActive: {
    width: 18,
    backgroundColor: '#C4B5FD',
  },
  proPaywall: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
  proPaywallCard: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.four,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#4C3B73',
  },
  proPaywallClose: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    zIndex: 1,
  },
  proPaywallTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
    textAlign: 'center',
  },
  proPaywallText: {
    textAlign: 'center',
    paddingHorizontal: Spacing.two,
  },
  proPaywallBuy: {
    alignSelf: 'stretch',
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#C4B5FD',
    marginTop: Spacing.two,
  },
  eventRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
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
});
