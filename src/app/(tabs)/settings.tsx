import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuroraBackground } from '@/components/aurora-background';
import { TabFade } from '@/components/tab-fade';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatHm } from '@/i18n';
import {
  FEEDING_MAX,
  FEEDING_MIN,
  FEEDING_STEP,
  TIMER_MAX,
  TIMER_MIN,
  TIMER_STEP,
  useAppStore,
  useT,
} from '@/state/app-state';

interface SettingSliderProps {
  label: string;
  hint: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: number;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onCommit: (value: number) => void;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
}

function SettingSlider({
  label,
  hint,
  icon,
  value,
  enabled,
  onEnabledChange,
  onCommit,
  min,
  max,
  step,
  format,
}: SettingSliderProps) {
  const theme = useTheme();
  const [local, setLocal] = useState(value);

  useEffect(() => setLocal(value), [value]);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.labelRow}>
          <MaterialCommunityIcons name={icon} size={22} color={theme.text} />
          <ThemedText type="smallBold">{label}</ThemedText>
        </View>
        <View style={styles.headerControls}>
          <ThemedText type="smallBold">{format(local)}</ThemedText>
          <Switch
            accessibilityLabel={label}
            value={enabled}
            onValueChange={onEnabledChange}
            trackColor={{ false: theme.backgroundSelected, true: '#C4B5FD' }}
            style={styles.switch}
          />
        </View>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={setLocal}
        onSlidingComplete={onCommit}
        minimumTrackTintColor="#C4B5FD"
        maximumTrackTintColor={theme.backgroundSelected}
        thumbTintColor="#C4B5FD"
      />

      <View style={styles.scaleRow}>
        <ThemedText type="small" themeColor="textSecondary">
          {format(min)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {format(max)}
        </ThemedText>
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        {hint}
      </ThemedText>
    </ThemedView>
  );
}

export default function SettingsScreen() {
  const sleepMinutes = useAppStore((state) => state.sleepMinutes);
  const awakeMinutes = useAppStore((state) => state.awakeMinutes);
  const feedingMinutes = useAppStore((state) => state.feedingMinutes);
  const sleepNotificationsEnabled = useAppStore(
    (state) => state.sleepNotificationsEnabled,
  );
  const awakeNotificationsEnabled = useAppStore(
    (state) => state.awakeNotificationsEnabled,
  );
  const feedingNotificationsEnabled = useAppStore(
    (state) => state.feedingNotificationsEnabled,
  );
  const setSleepMinutes = useAppStore((state) => state.setSleepMinutes);
  const setAwakeMinutes = useAppStore((state) => state.setAwakeMinutes);
  const setFeedingMinutes = useAppStore((state) => state.setFeedingMinutes);
  const setNotificationsEnabled = useAppStore((state) => state.setNotificationsEnabled);
  const language = useAppStore((state) => state.language);
  const t = useT();
  const timerFmt = (v: number) => formatHm(v, language);
  const minutesFmt = (v: number) => `${v} ${t('unit.minutes')}`;

  return (
    <TabFade>
      <ThemedView style={styles.container}>
        <AuroraBackground />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}>
            <View style={styles.inner}>
            <SettingSlider
              label={t('settings.sleepTime')}
              hint={t('settings.sleepHint')}
              icon="moon-waning-crescent"
              value={sleepMinutes}
              enabled={sleepNotificationsEnabled}
              onEnabledChange={(enabled) => setNotificationsEnabled('sleep', enabled)}
              onCommit={setSleepMinutes}
              min={TIMER_MIN}
              max={TIMER_MAX}
              step={TIMER_STEP}
              format={timerFmt}
            />

            <SettingSlider
              label={t('settings.awakeTime')}
              hint={t('settings.awakeHint')}
              icon="white-balance-sunny"
              value={awakeMinutes}
              enabled={awakeNotificationsEnabled}
              onEnabledChange={(enabled) => setNotificationsEnabled('awake', enabled)}
              onCommit={setAwakeMinutes}
              min={TIMER_MIN}
              max={TIMER_MAX}
              step={TIMER_STEP}
              format={timerFmt}
            />

            <SettingSlider
              label={t('settings.feedingTime')}
              hint={t('settings.feedingHint')}
              icon="baby-bottle-outline"
              value={feedingMinutes}
              enabled={feedingNotificationsEnabled}
              onEnabledChange={(enabled) => setNotificationsEnabled('feeding', enabled)}
              onCommit={setFeedingMinutes}
              min={FEEDING_MIN}
              max={FEEDING_MAX}
              step={FEEDING_STEP}
              format={minutesFmt}
            />
            </View>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    </TabFade>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    alignSelf: 'stretch',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
  card: {
    alignSelf: 'stretch',
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  switch: {
    transform: [{ scale: 0.78 }],
  },
  slider: {
    width: '100%',
    height: 40,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
