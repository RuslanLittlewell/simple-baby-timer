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
import { type ActivityKind } from '@/lib/notifications';
import { useAppState } from '@/state/app-state';

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

const pad2 = (n: number) => String(n).padStart(2, '0');
const formatElapsed = (seconds: number) =>
  `${pad2(Math.floor(seconds / 3600))}:${pad2(Math.floor((seconds % 3600) / 60))}:${pad2(seconds % 60)}`;

export default function ActivityScreen() {
  const {
    session,
    startActivity,
    stopActivity,
    sleepMinutes,
    awakeMinutes,
    feedingMinutes,
    language,
    t,
  } = useAppState();
  const [nowTs, setNowTs] = useState(Date.now());

  // Тикаем раз в секунду, пока активность идёт.
  useEffect(() => {
    if (!session) return;
    setNowTs(Date.now());
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session]);

  const active = session ? ACTIVITIES.find((a) => a.id === session.kind) : undefined;
  const elapsed = session ? Math.max(0, Math.floor((nowTs - session.startedAt) / 1000)) : 0;
  let statusNote = '';
  if (session?.kind === 'sleep')
    statusNote = t('activity.noteSleep', { time: formatHm(sleepMinutes, language) });
  else if (session?.kind === 'awake')
    statusNote = t('activity.noteAwake', { time: formatHm(awakeMinutes, language) });
  else if (session?.kind === 'feeding')
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
            {session && active ? (
              <>
                <View style={styles.statusHead}>
                  <View style={[styles.dot, { backgroundColor: ACTIVITY_ACCENT[active.gradKey] }]} />
                  <ThemedText type="smallBold">{t(`kind.${session.kind}`)}</ThemedText>
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
          </ThemedView>

          {/* Активности с заливкой как на календаре */}
          <View style={styles.list}>
            {ACTIVITIES.map((activity) => {
              const isActive = session?.kind === activity.id;
              const dimmed = !!session && !isActive;
              const fg = ACTIVITY_FG[activity.gradKey];
              return (
                <Pressable
                  key={activity.id}
                  onPress={() => (isActive ? stopActivity() : startActivity(activity.id))}
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
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
