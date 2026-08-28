import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { signOut } from '@/lib/supabase';
import { deleteAccount } from '@/lib/sync';
import { useAppStore, useT } from '@/state/app-state';
import { SettingsSection } from './settings-section';

export function AccountSection() {
  const router = useRouter(); const theme = useTheme(); const t = useT();
  const clearAccountData = useAppStore((s) => s.clearAccountData);
  const [deleting, setDeleting] = useState(false);
  const confirmDelete = () => Alert.alert(t('settings.deleteAccount'), t('settings.deleteAccountConfirm'), [
    { text: t('editor.cancel'), style: 'cancel' },
    { text: t('editor.delete'), style: 'destructive', onPress: () => {
      if (deleting) return; setDeleting(true);
      void (async () => { try { await deleteAccount(); } catch { Alert.alert(t('settings.deleteAccountError')); setDeleting(false); return; }
        await clearAccountData(); await signOut(); router.replace('/'); })();
    } },
  ]);
  return <SettingsSection title={t('settings.accountSection')}>
    <Pressable accessibilityRole="button" disabled={deleting} onPress={confirmDelete}
      style={({ pressed }) => [styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, (pressed || deleting) && styles.pressed]}>
      <MaterialCommunityIcons name="trash-can-outline" size={30} color={theme.danger} />
      <ThemedText type="smallBold" themeColor="danger" style={styles.flex}>{t('settings.deleteAccount')}</ThemedText>
    </Pressable>
  </SettingsSection>;
}
const styles = StyleSheet.create({
  card: { minHeight: 76, borderWidth: 1, borderRadius: 20, paddingHorizontal: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  flex: { flex: 1 }, pressed: { opacity: 0.7 },
});
