import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AuroraBackground } from '@/components/aurora-background';
import { TabFade } from '@/components/tab-fade';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WheelField } from '@/components/wheel-field';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { signOut } from '@/lib/supabase';
import { deleteAccount } from '@/lib/sync';
import { useAppStore, useT } from '@/state/app-state';

type ReminderKind = 'settling' | 'sleep' | 'awake';

type ReminderCardProps = {
  label: string;
  timeLabel: string;
  hint: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: number;
  enabled: boolean;
  expanded: boolean;
  onToggle: () => void;
  onEnabledChange: (enabled: boolean) => void;
  onCommit: (value: number) => void;
};

const timerDate = (minutes: number) => {
  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
};

const timerText = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

function ReminderCard({ label, timeLabel, hint, icon, value, enabled, expanded, onToggle, onEnabledChange, onCommit }: ReminderCardProps) {
  const theme = useTheme();
  const themeMode = useAppStore((state) => state.themeMode);
  const chevronRotation = useSharedValue(expanded ? 90 : 0);

  useEffect(() => {
    chevronRotation.value = withTiming(expanded ? 90 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [chevronRotation, expanded]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  return (
    <Animated.View layout={LinearTransition.duration(260).easing(Easing.out(Easing.cubic))}>
    <ThemedView type="backgroundElement" style={[styles.reminderCard, { borderColor: theme.border }]}>
      <View style={styles.reminderHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={label}
          onPress={onToggle}
          style={({ pressed }) => [styles.reminderTitleButton, pressed && styles.pressed]}>
          <MaterialCommunityIcons name={icon} size={30} color={theme.text} />
          <View style={styles.reminderCopy}>
            <ThemedText style={styles.rowTitle}>{label}</ThemedText>
          </View>
        </Pressable>
        <View style={styles.switchSlot}>
          <Switch
            accessibilityLabel={label}
            value={enabled}
            onValueChange={onEnabledChange}
            trackColor={{ false: theme.border, true: '#C4B5FD' }}
            style={[styles.switch, themeMode === 'light' && styles.lightSwitchBorder]}
          />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onToggle} hitSlop={12} style={styles.chevronButton}>
          <Animated.View style={chevronStyle}>
            <MaterialCommunityIcons name="chevron-right" size={27} color={theme.textSecondary} />
          </Animated.View>
        </Pressable>
      </View>
      {expanded && (
        <Animated.View
          entering={FadeIn.duration(240).easing(Easing.out(Easing.cubic))}
          exiting={FadeOut.duration(170).easing(Easing.in(Easing.cubic))}
          style={[styles.reminderDetails, { borderTopColor: theme.border }]}>
          <View style={styles.timeRow}>
            <ThemedText type="smallBold">{timeLabel}</ThemedText>
            <WheelField
              mode="time"
              value={timerDate(value)}
              displayText={timerText(value)}
              onChange={(date) => onCommit(date.getHours() * 60 + date.getMinutes())}
              style={[styles.timeInput, { backgroundColor: theme.background, borderColor: theme.border }]}
              textStyle={styles.timeInputText}
            />
          </View>
          <ThemedText type="small" themeColor="textSecondary">{hint}</ThemedText>
        </Animated.View>
      )}
    </ThemedView>
    </Animated.View>
  );
}

export default function SettingsScreen() {
  const sleepMinutes = useAppStore((state) => state.sleepMinutes);
  const awakeMinutes = useAppStore((state) => state.awakeMinutes);
  const settlingMinutes = useAppStore((state) => state.settlingMinutes);
  const sleepEnabled = useAppStore((state) => state.sleepNotificationsEnabled);
  const awakeEnabled = useAppStore((state) => state.awakeNotificationsEnabled);
  const settlingEnabled = useAppStore((state) => state.settlingNotificationsEnabled);
  const setSleepMinutes = useAppStore((state) => state.setSleepMinutes);
  const setAwakeMinutes = useAppStore((state) => state.setAwakeMinutes);
  const setSettlingMinutes = useAppStore((state) => state.setSettlingMinutes);
  const setNotificationsEnabled = useAppStore((state) => state.setNotificationsEnabled);
  const proActive = useAppStore((state) => state.proActive);
  const children = useAppStore((state) => state.children);
  const activeChildId = useAppStore((state) => state.activeChildId);
  const proAccess = proActive || children.find((child) => child.id === activeChildId)?.proEnabled === true;
  const themeMode = useAppStore((state) => state.themeMode);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const clearAccountData = useAppStore((state) => state.clearAccountData);
  const router = useRouter();
  const theme = useTheme();
  const t = useT();
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState<Record<ReminderKind, boolean>>({
    settling: settlingEnabled,
    sleep: sleepEnabled,
    awake: awakeEnabled,
  });
  const toggle = (kind: ReminderKind, enabled: boolean) =>
    setExpanded((current) => ({
      ...current,
      [kind]: enabled ? true : !current[kind],
    }));
  const updateReminder = (kind: ReminderKind, enabled: boolean) => {
    setExpanded((current) => ({ ...current, [kind]: enabled }));
    setNotificationsEnabled(kind, enabled);
  };

  const confirmDeleteAccount = () => Alert.alert(t('settings.deleteAccount'), t('settings.deleteAccountConfirm'), [
    { text: t('editor.cancel'), style: 'cancel' },
    { text: t('editor.delete'), style: 'destructive', onPress: () => {
      if (deleting) return;
      setDeleting(true);
      void (async () => {
        try { await deleteAccount(); } catch {
          Alert.alert(t('settings.deleteAccountError'));
          setDeleting(false);
          return;
        }
        await clearAccountData();
        await signOut();
        router.replace('/');
      })();
    } },
  ]);

  return (
    <TabFade>
      <ThemedView gradient style={styles.container}>
        <AuroraBackground />
        <SafeAreaView style={[styles.safeArea, Platform.OS === 'ios' && Platform.isPad && styles.ipadTopTabsInset]} edges={['top', 'left', 'right']}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inner}>
              <View style={styles.section}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>{t('settings.appearanceSection')}</ThemedText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('settings.theme')}
                  onPress={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
                  style={({ pressed }) => [styles.compactCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, pressed && styles.pressed]}>
                  <MaterialCommunityIcons name={themeMode === 'dark' ? 'weather-night' : 'white-balance-sunny'} size={30} color={theme.text} />
                  <ThemedText style={[styles.rowTitle, styles.flex]}>{t('settings.theme')}</ThemedText>
                  <ThemedText type="smallBold" themeColor="textSecondary">{themeMode === 'dark' ? t('settings.themeDark') : t('settings.themeLight')}</ThemedText>
                </Pressable>
              </View>

              <View style={styles.section}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>{t('settings.remindersSection')}</ThemedText>
                <View style={styles.reminderList}>
                  {proAccess && <ReminderCard label={t('settings.settlingTime')} timeLabel={t('settings.remindAfter')} hint={t('settings.settlingHint')} icon="sleep" value={settlingMinutes} enabled={settlingEnabled} expanded={settlingEnabled || expanded.settling} onToggle={() => toggle('settling', settlingEnabled)} onEnabledChange={(value) => updateReminder('settling', value)} onCommit={setSettlingMinutes} />}
                  <ReminderCard label={t('settings.sleepTime')} timeLabel={t('settings.remindAfter')} hint={t('settings.sleepHint')} icon="moon-waning-crescent" value={sleepMinutes} enabled={sleepEnabled} expanded={sleepEnabled || expanded.sleep} onToggle={() => toggle('sleep', sleepEnabled)} onEnabledChange={(value) => updateReminder('sleep', value)} onCommit={setSleepMinutes} />
                  <ReminderCard label={t('settings.awakeTime')} timeLabel={t('settings.remindAfter')} hint={t('settings.awakeHint')} icon="white-balance-sunny" value={awakeMinutes} enabled={awakeEnabled} expanded={awakeEnabled || expanded.awake} onToggle={() => toggle('awake', awakeEnabled)} onEnabledChange={(value) => updateReminder('awake', value)} onCommit={setAwakeMinutes} />
                </View>
              </View>

              <View style={styles.section}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>{t('settings.accountSection')}</ThemedText>
                <Pressable accessibilityRole="button" disabled={deleting} onPress={confirmDeleteAccount} style={({ pressed }) => [styles.compactCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, (pressed || deleting) && styles.pressed]}>
                  <MaterialCommunityIcons name="trash-can-outline" size={30} color={theme.danger} />
                  <ThemedText type="smallBold" themeColor="danger" style={styles.flex}>{t('settings.deleteAccount')}</ThemedText>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    </TabFade>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  ipadTopTabsInset: { paddingTop: 52 },
  scroll: { flex: 1, alignSelf: 'stretch' },
  scrollContent: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: BottomTabInset + Spacing.three, alignItems: 'center' },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.five },
  section: { gap: Spacing.two },
  sectionTitle: { fontSize: 16, lineHeight: 22, paddingHorizontal: Spacing.one },
  compactCard: { minHeight: 76, borderWidth: 1, borderRadius: 20, paddingHorizontal: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  reminderList: { gap: Spacing.two },
  reminderCard: { borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  reminderHeader: { minHeight: 76, paddingHorizontal: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  reminderTitleButton: { minHeight: 76, flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  reminderCopy: { flex: 1 },
  reminderDetails: { borderTopWidth: 1, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, gap: Spacing.two },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three },
  timeInput: { minWidth: 116, alignItems: 'center', paddingHorizontal: Spacing.three, paddingVertical: 10, borderWidth: 1, borderRadius: 14 },
  timeInputText: { fontVariant: ['tabular-nums'], fontSize: 16, lineHeight: 22 },
  rowTitle: { fontSize: 16, lineHeight: 22, fontWeight: 700 },
  flex: { flex: 1 },
  switchSlot: { alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center' },
  chevronButton: { alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center' },
  switch: { transform: [{ scale: 0.86 }] },
  lightSwitchBorder: { borderRadius: 16, boxShadow: 'inset 0 0 0 2px #C4B5FD' },
  pressed: { opacity: 0.7 },
});
