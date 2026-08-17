import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuroraBackground } from '@/components/aurora-background';
import { TabFade } from '@/components/tab-fade';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatHm } from '@/i18n';
import { signOut } from '@/lib/supabase';
import { deleteAccount } from '@/lib/sync';
import {
  SETTLING_MAX,
  SETTLING_MIN,
  SETTLING_STEP,
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
            trackColor={{ false: theme.border, true: '#C4B5FD' }}
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
        maximumTrackTintColor={theme.border}
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
  const settlingMinutes = useAppStore((state) => state.settlingMinutes);
  const sleepNotificationsEnabled = useAppStore(
    (state) => state.sleepNotificationsEnabled,
  );
  const awakeNotificationsEnabled = useAppStore(
    (state) => state.awakeNotificationsEnabled,
  );
  const settlingNotificationsEnabled = useAppStore(
    (state) => state.settlingNotificationsEnabled,
  );
  const setSleepMinutes = useAppStore((state) => state.setSleepMinutes);
  const setAwakeMinutes = useAppStore((state) => state.setAwakeMinutes);
  const setSettlingMinutes = useAppStore((state) => state.setSettlingMinutes);
  const setNotificationsEnabled = useAppStore((state) => state.setNotificationsEnabled);
  const language = useAppStore((state) => state.language);
  const proActive = useAppStore((state) => state.proActive);
  const children = useAppStore((state) => state.children);
  const activeChildId = useAppStore((state) => state.activeChildId);
  // Settling is a PRO activity, so its reminder is only configurable there.
  const proAccess =
    proActive || children.find((child) => child.id === activeChildId)?.proEnabled === true;
  const themeMode = useAppStore((state) => state.themeMode);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const clearAccountData = useAppStore((state) => state.clearAccountData);
  const router = useRouter();
  const theme = useTheme();
  const t = useT();
  const [deleting, setDeleting] = useState(false);
  const timerFmt = (v: number) => formatHm(v, language);
  const minutesFmt = (v: number) => `${v} ${t('unit.minutes')}`;

  const confirmDeleteAccount = () =>
    Alert.alert(t('settings.deleteAccount'), t('settings.deleteAccountConfirm'), [
      { text: t('editor.cancel'), style: 'cancel' },
      {
        text: t('editor.delete'),
        style: 'destructive',
        onPress: () => {
          if (deleting) return;
          setDeleting(true);
          void (async () => {
            try {
              await deleteAccount();
            } catch {
              Alert.alert(t('settings.deleteAccountError'));
              setDeleting(false);
              return;
            }
            // The device is only wiped once the server confirmed the deletion.
            await clearAccountData();
            await signOut();
            // Clearing resets onboarding, but this screen is a tab route and
            // would happily stay mounted — send the user to the root, which
            // now renders the onboarding flow from its first step.
            router.replace('/');
          })();
        },
      },
    ]);

  return (
    <TabFade>
      <ThemedView gradient style={styles.container}>
        <AuroraBackground />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}>
            <View style={styles.inner}>
            <ThemedView type="backgroundElement" style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons
                    name={themeMode === 'dark' ? 'weather-night' : 'white-balance-sunny'}
                    size={22}
                    color={theme.text}
                  />
                  <ThemedText type="smallBold">{t('settings.theme')}</ThemedText>
                </View>
                <View style={styles.headerControls}>
                  <ThemedText type="smallBold">
                    {themeMode === 'dark' ? t('settings.themeDark') : t('settings.themeLight')}
                  </ThemedText>
                  <Switch
                    accessibilityLabel={t('settings.theme')}
                    value={themeMode === 'light'}
                    onValueChange={(isLight) => setThemeMode(isLight ? 'light' : 'dark')}
                    trackColor={{ false: theme.border, true: '#C4B5FD' }}
                    style={styles.switch}
                  />
                </View>
              </View>
            </ThemedView>

            {proAccess && (
              <SettingSlider
                label={t('settings.settlingTime')}
                hint={t('settings.settlingHint')}
                icon="sleep"
                value={settlingMinutes}
                enabled={settlingNotificationsEnabled}
                onEnabledChange={(enabled) => setNotificationsEnabled('settling', enabled)}
                onCommit={setSettlingMinutes}
                min={SETTLING_MIN}
                max={SETTLING_MAX}
                step={SETTLING_STEP}
                format={minutesFmt}
              />
            )}

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

            <Pressable
              accessibilityRole="button"
              disabled={deleting}
              onPress={confirmDeleteAccount}
              style={({ pressed }) => [
                styles.card,
                styles.labelRow,
                styles.deleteAccount,
                { backgroundColor: theme.backgroundElement },
                (pressed || deleting) && styles.pressed,
              ]}>
              <MaterialCommunityIcons name="trash-can-outline" size={22} color={theme.danger} />
              <ThemedText type="smallBold" themeColor="danger">
                {t('settings.deleteAccount')}
              </ThemedText>
            </Pressable>
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
    gap: Spacing.two,
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
  // The only card without a control on the right, so its row is centred
  // instead of starting at the left edge like the settings above.
  deleteAccount: {
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
