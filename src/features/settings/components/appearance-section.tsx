import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore, useT } from '@/state/app-state';
import { SettingsSection } from './settings-section';

export function AppearanceSection() {
  const theme = useTheme();
  const t = useT();
  const mode = useAppStore((s) => s.themeMode);
  const setMode = useAppStore((s) => s.setThemeMode);
  return <SettingsSection title={t('settings.appearanceSection')}>
    <Pressable accessibilityRole="button" accessibilityLabel={t('settings.theme')}
      onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
      style={({ pressed }) => [styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, pressed && styles.pressed]}>
      <MaterialCommunityIcons name={mode === 'dark' ? 'weather-night' : 'white-balance-sunny'} size={30} color={theme.text} />
      <ThemedText style={[styles.title, styles.flex]}>{t('settings.theme')}</ThemedText>
      <ThemedText type="smallBold" themeColor="textSecondary">{mode === 'dark' ? t('settings.themeDark') : t('settings.themeLight')}</ThemedText>
    </Pressable>
  </SettingsSection>;
}
const styles = StyleSheet.create({
  card: { minHeight: 76, borderWidth: 1, borderRadius: 20, paddingHorizontal: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  title: { fontSize: 16, lineHeight: 22, fontWeight: 700 }, flex: { flex: 1 }, pressed: { opacity: 0.7 },
});
