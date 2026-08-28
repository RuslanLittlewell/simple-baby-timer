import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuroraBackground } from '@/components/aurora-background';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAppStore, useT } from '@/state/app-state';
import { AccountSection } from './components/account-section';
import { AppearanceSection } from './components/appearance-section';
import { ReminderCard } from './components/reminder-card';
import { SettingsSection } from './components/settings-section';

type ReminderKind = 'settling' | 'sleep' | 'awake';

export default function SettingsScreen() {
  const sleepMinutes = useAppStore((s) => s.sleepMinutes);
  const awakeMinutes = useAppStore((s) => s.awakeMinutes);
  const settlingMinutes = useAppStore((s) => s.settlingMinutes);
  const sleepEnabled = useAppStore((s) => s.sleepNotificationsEnabled);
  const awakeEnabled = useAppStore((s) => s.awakeNotificationsEnabled);
  const settlingEnabled = useAppStore((s) => s.settlingNotificationsEnabled);
  const setSleepMinutes = useAppStore((s) => s.setSleepMinutes);
  const setAwakeMinutes = useAppStore((s) => s.setAwakeMinutes);
  const setSettlingMinutes = useAppStore((s) => s.setSettlingMinutes);
  const setNotificationsEnabled = useAppStore((s) => s.setNotificationsEnabled);
  const t = useT();
  const [expanded, setExpanded] = useState<Record<ReminderKind, boolean>>({ settling: settlingEnabled, sleep: sleepEnabled, awake: awakeEnabled });
  const toggle = (kind: ReminderKind, enabled: boolean) => setExpanded((current) => ({ ...current, [kind]: enabled ? true : !current[kind] }));
  const updateReminder = (kind: ReminderKind, enabled: boolean) => { setExpanded((current) => ({ ...current, [kind]: enabled })); setNotificationsEnabled(kind, enabled); };

  return <ThemedView gradient style={styles.container}>
    <AuroraBackground />
    <SafeAreaView style={[styles.safeArea, Platform.OS === 'ios' && Platform.isPad && styles.ipadTopTabsInset]} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          <AppearanceSection />
          <SettingsSection title={t('settings.remindersSection')}>
            <View style={styles.reminderList}>
              <ReminderCard label={t('settings.settlingTime')} timeLabel={t('settings.remindAfter')} hint={t('settings.settlingHint')} icon="sleep" value={settlingMinutes} enabled={settlingEnabled} expanded={settlingEnabled || expanded.settling} onToggle={() => toggle('settling', settlingEnabled)} onEnabledChange={(value) => updateReminder('settling', value)} onCommit={setSettlingMinutes} />
              <ReminderCard label={t('settings.sleepTime')} timeLabel={t('settings.remindAfter')} hint={t('settings.sleepHint')} icon="moon-waning-crescent" value={sleepMinutes} enabled={sleepEnabled} expanded={sleepEnabled || expanded.sleep} onToggle={() => toggle('sleep', sleepEnabled)} onEnabledChange={(value) => updateReminder('sleep', value)} onCommit={setSleepMinutes} />
              <ReminderCard label={t('settings.awakeTime')} timeLabel={t('settings.remindAfter')} hint={t('settings.awakeHint')} icon="white-balance-sunny" value={awakeMinutes} enabled={awakeEnabled} expanded={awakeEnabled || expanded.awake} onToggle={() => toggle('awake', awakeEnabled)} onEnabledChange={(value) => updateReminder('awake', value)} onCommit={setAwakeMinutes} />
            </View>
          </SettingsSection>
          <AccountSection />
        </View>
      </ScrollView>
    </SafeAreaView>
  </ThemedView>;
}

const styles = StyleSheet.create({
  container: { flex: 1 }, safeArea: { flex: 1 }, ipadTopTabsInset: { paddingTop: 52 }, scroll: { flex: 1, alignSelf: 'stretch' },
  scrollContent: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: BottomTabInset + Spacing.three, alignItems: 'center' },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.five }, reminderList: { gap: Spacing.two },
});
