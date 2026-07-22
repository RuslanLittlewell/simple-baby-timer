import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  useAppState,
} from '@/state/app-state';

type SettingSliderProps = {
  label: string;
  hint: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: number;
  onCommit: (value: number) => void;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
};

function SettingSlider({
  label,
  hint,
  icon,
  value,
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
        <ThemedText type="smallBold">{format(local)}</ThemedText>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={setLocal}
        onSlidingComplete={onCommit}
        minimumTrackTintColor="#3c87f7"
        maximumTrackTintColor={theme.backgroundSelected}
        thumbTintColor="#3c87f7"
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
  const {
    sleepMinutes,
    awakeMinutes,
    feedingMinutes,
    setSleepMinutes,
    setAwakeMinutes,
    setFeedingMinutes,
    language,
    t,
  } = useAppState();
  const timerFmt = (v: number) => formatHm(v, language);
  const minutesFmt = (v: number) => `${v} ${t('unit.minutes')}`;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}>
          <View style={styles.inner}>
            <View style={styles.header}>
              <ThemedText type="subtitle">{t('settings.title')}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t('settings.subtitle')}
              </ThemedText>
            </View>

            <SettingSlider
              label={t('settings.sleepTime')}
              hint={t('settings.sleepHint')}
              icon="moon-waning-crescent"
              value={sleepMinutes}
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
    paddingBottom: BottomTabInset + Spacing.three,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
  header: {
    alignSelf: 'stretch',
    gap: Spacing.one,
    paddingTop: Spacing.four,
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
  slider: {
    width: '100%',
    height: 40,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
