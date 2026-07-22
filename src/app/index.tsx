import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LanguageSelect } from '@/components/language-select';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACTIVITY_ACCENT, ACTIVITY_FG, ACTIVITY_GRADIENTS } from '@/constants/activities';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { formatHm } from '@/i18n';
import { type EventKind } from '@/lib/activity-store';
import { type ActivityKind } from '@/lib/notifications';
import { useAppStore, useT } from '@/state/app-state';

type GradKey = keyof typeof ACTIVITY_GRADIENTS;

type Activity = {
  id: ActivityKind;
  gradKey: GradKey;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const ACTIVITIES: Activity[] = [
  { id: 'sleep', gradKey: 'sleep', icon: 'moon-waning-crescent' },
  { id: 'feeding', gradKey: 'feed', icon: 'baby-bottle-outline' },
  { id: 'awake', gradKey: 'awake', icon: 'white-balance-sunny' },
];

/** Полноширинные строки: сон и бодрствование, как и было. */
const MAIN_ACTIVITIES = ACTIVITIES.filter((a) => a.id !== 'feeding');
const FEEDING = ACTIVITIES.find((a) => a.id === 'feeding')!;

/** Второй ряд: разовые отметки по краям, кормление по центру. */
const EVENTS: { id: EventKind; gradKey: GradKey; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { id: 'poop', gradKey: 'poop', icon: 'emoticon-poop' },
  { id: 'diaper', gradKey: 'diaper', icon: 'diaper-outline' },
];

const pad2 = (n: number) => String(n).padStart(2, '0');
const formatElapsed = (seconds: number) =>
  `${pad2(Math.floor(seconds / 3600))}:${pad2(Math.floor((seconds % 3600) / 60))}:${pad2(seconds % 60)}`;

export default function ActivityScreen() {
  const session = useAppStore((state) => state.session);
  const feeding = useAppStore((state) => state.feeding);
  const startActivity = useAppStore((state) => state.startActivity);
  const stopActivity = useAppStore((state) => state.stopActivity);
  const sleepMinutes = useAppStore((state) => state.sleepMinutes);
  const awakeMinutes = useAppStore((state) => state.awakeMinutes);
  const feedingMinutes = useAppStore((state) => state.feedingMinutes);
  const logEvent = useAppStore((state) => state.logEvent);
  const language = useAppStore((state) => state.language);
  const t = useT();
  const [nowTs, setNowTs] = useState(Date.now());

  // Тикаем раз в секунду, пока идёт хоть одна из дорожек.
  useEffect(() => {
    if (!session && !feeding) return;
    setNowTs(Date.now());
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session, feeding]);

  const secondsSince = (from: number) => Math.max(0, Math.floor((nowTs - from) / 1000));

  // Крупно показываем основной режим; если идёт только кормление — его.
  const primary = session ?? feeding;
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
          <ThemedText type="subtitle">{t('activity.title')}</ThemedText>
          <LanguageSelect />
        </View>

        <View style={styles.center}>
          {/* Таймер и активный режим */}
          <ThemedView type="backgroundElement" style={styles.status}>
            {primary && active ? (
              <>
                <View style={styles.statusHead}>
                  <View style={[styles.dot, { backgroundColor: ACTIVITY_ACCENT[active.gradKey] }]} />
                  <ThemedText type="smallBold">{t(`kind.${primary.kind}`)}</ThemedText>
                </View>
                <ThemedText style={styles.timer}>{formatElapsed(elapsed)}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {statusNote}
                </ThemedText>
              </>
            ) : (
              <>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('activity.idle')}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.timer}>
                  00:00:00
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('activity.chooseBelow')}
                </ThemedText>
              </>
            )}

            {/* Кормление идёт параллельно основному режиму — показываем вторым таймером */}
            {session && feeding && (
              <View style={styles.secondary}>
                <MaterialCommunityIcons
                  name="baby-bottle-outline"
                  size={18}
                  color={ACTIVITY_ACCENT.feed}
                />
                <ThemedText type="smallBold" style={styles.secondaryLabel}>
                  {t('kind.feeding')}
                </ThemedText>
                <ThemedText style={styles.secondaryTimer}>
                  {formatElapsed(secondsSince(feeding.startedAt))}
                </ThemedText>
              </View>
            )}
          </ThemedView>

          {/* Активности с заливкой как на календаре */}
          <View style={styles.list}>
            {MAIN_ACTIVITIES.map((activity) => {
              const isActive = session?.kind === activity.id;
              const dimmed = !!session && !isActive;
              const fg = ACTIVITY_FG[activity.gradKey];
              return (
                <Pressable
                  key={activity.id}
                  onPress={() =>
                    isActive ? stopActivity(activity.id) : startActivity(activity.id)
                  }
                  style={({ pressed }) => pressed && styles.pressed}>
                  <LinearGradient
                    colors={ACTIVITY_GRADIENTS[activity.gradKey]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.row, dimmed && styles.rowDimmed]}>
                    <MaterialCommunityIcons name={activity.icon} size={26} color={fg} />
                    <ThemedText style={[styles.rowLabel, { color: fg }]}>
                      {t(`kind.${activity.id}`)}
                    </ThemedText>
                    <MaterialCommunityIcons
                      name={isActive ? 'stop-circle' : 'play-circle'}
                      size={28}
                      color={fg}
                    />
                  </LinearGradient>
                </Pressable>
              );
            })}

            {/* Второй ряд: отметка — кормление — отметка (20 / 60 / 20) */}
            <View style={styles.eventRow}>
              {[EVENTS[0], FEEDING, EVENTS[1]].map((item) => {
                const isFeeding = item.id === 'feeding';
                const isActive = isFeeding && !!feeding;
                const fg = ACTIVITY_FG[item.gradKey];

                return (
                  <Pressable
                    key={item.id}
                    accessibilityLabel={t(`kind.${item.id}`)}
                    onPress={() => {
                      if (!isFeeding) return logEvent(item.id as EventKind);
                      return isActive ? stopActivity('feeding') : startActivity('feeding');
                    }}
                    style={({ pressed }) => [
                      isFeeding ? styles.eventWide : styles.eventNarrow,
                      pressed && styles.pressed,
                    ]}>
                    <LinearGradient
                      colors={ACTIVITY_GRADIENTS[item.gradKey]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={isFeeding ? styles.row : styles.eventTile}>
                      <MaterialCommunityIcons name={item.icon} size={26} color={fg} />
                      {isFeeding && (
                        <>
                          <ThemedText
                            style={[styles.rowLabel, { color: fg }]}
                            numberOfLines={1}>
                            {t('kind.feeding')}
                          </ThemedText>
                          <MaterialCommunityIcons
                            name={isActive ? 'stop-circle' : 'play-circle'}
                            size={28}
                            color={fg}
                          />
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                );
              })}
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
  center: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: Spacing.five,
  },
  status: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.one,
  },
  statusHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timer: {
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  secondaryLabel: {
    marginRight: Spacing.one,
  },
  secondaryTimer: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  list: {
    alignSelf: 'stretch',
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.four,
  },
  rowDimmed: {
    opacity: 0.45,
  },
  eventRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: Spacing.three,
  },
  // 20 / 60 / 20 — доли задаём flex, промежутки съедает gap.
  eventNarrow: {
    flex: 2,
  },
  eventWide: {
    flex: 6,
  },
  eventTile: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
