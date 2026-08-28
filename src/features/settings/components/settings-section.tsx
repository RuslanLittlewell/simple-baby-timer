import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return <View style={styles.section}>
    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.title}>{title}</ThemedText>
    {children}
  </View>;
}
const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  title: { fontSize: 16, lineHeight: 22, paddingHorizontal: Spacing.one },
});
