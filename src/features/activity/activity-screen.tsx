import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LanguageSelect } from '@/components/language-select';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatHm } from '@/i18n';
import { type EventKind } from '@/lib/activity-store';
import { useAppStore, useT } from '@/state/app-state';

import { ActivityRow } from './components/activity-row';
import { EventTile } from './components/event-tile';
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
  const language = useAppStore((state) => state.language);
  const children = useAppStore((state) => state.children);
  const activeChildId = useAppStore((state) => state.activeChildId);
  const t = useT();
  const [nowTs, setNowTs] = useState(Date.now());

  const activeChild = children.find((child) => child.id === activeChildId);

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

  const secondsSince = (from: number) => Math.max(0, Math.floor((nowTs - from) / 1000));

  const primary = mainSession ?? feedingSession;
  const active = primary ? ACTIVITIES.find((a) => a.id === primary.kind) : undefined;
  const elapsed = primary ? secondsSince(primary.startedAt) : 0;
  let statusNote = '';
  if (primary?.kind === 'sleep')
    statusNote = t('activity.noteSleep', { time: formatHm(sleepMinutes, language) });
  else if (primary?.kind === 'awake')
    statusNote = t('activity.noteAwake', { time: formatHm(awakeMinutes, language) });
  else if (primary?.kind === 'feeding')
    statusNote = t('activity.noteFeeding', { n: feedingMinutes });

  return (
    <ThemedView style={styles.container}>
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
                <ThemedText type="smallBold" numberOfLines={1} style={styles.childName}>
                  {activeChild.name}
                </ThemedText>
              </ThemedView>
            </Pressable>
          ) : (
            <View />
          )}
          <LanguageSelect />
        </View>

        <View style={styles.center}>
          <StatusCard
            primaryKind={primary?.kind ?? null}
            gradKey={active?.gradKey ?? null}
            elapsed={elapsed}
            statusNote={statusNote}
            feedingElapsed={
              mainSession && feedingSession ? secondsSince(feedingSession.startedAt) : null
            }
          />

          <View style={styles.list}>
            {MAIN_ACTIVITIES.map((activity) => {
              const isActive = mainSession?.kind === activity.id;
              return (
                <ActivityRow
                  key={activity.id}
                  icon={activity.icon}
                  gradKey={activity.gradKey}
                  label={t(`kind.${activity.id}`)}
                  isActive={isActive}
                  dimmed={!!mainSession && !isActive}
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
              <View style={styles.eventNarrow}>
                <EventTile
                  icon={EVENTS[0].icon}
                  gradKey={EVENTS[0].gradKey}
                  accessibilityLabel={t(`kind.${EVENTS[0].id}`)}
                  onPress={() => logEvent(EVENTS[0].id as EventKind)}
                />
              </View>
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
                  icon={EVENTS[1].icon}
                  gradKey={EVENTS[1].gradKey}
                  accessibilityLabel={t(`kind.${EVENTS[1].id}`)}
                  onPress={() => logEvent(EVENTS[1].id as EventKind)}
                />
              </View>
            </View>
          </View>
        </View>
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
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  childName: {
    maxWidth: 96,
  },
  center: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: Spacing.five,
  },
  list: {
    alignSelf: 'stretch',
    gap: Spacing.three,
  },
  eventRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: Spacing.three,
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
