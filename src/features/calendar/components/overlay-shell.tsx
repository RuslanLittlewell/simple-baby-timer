import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { modalStyles } from '../modal-styles';

interface OverlayShellProps {
  navLabel: string;
  
  
  onSwitchPeriod: () => void;
  
  switchLabel: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  children: ReactNode;
}



export function OverlayShell({
  navLabel,
  onSwitchPeriod,
  switchLabel,
  onClose,
  onPrev,
  onNext,
  children,
}: OverlayShellProps) {
  const theme = useTheme();
  return (
    <View style={modalStyles.backdrop}>
      <BlurView intensity={35} tint="dark" pointerEvents="none" style={modalStyles.blur} />
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[modalStyles.card, styles.card, { backgroundColor: theme.background }]}>
        <View style={modalStyles.header}>
          <Pressable
            accessibilityLabel={switchLabel}
            onPress={onSwitchPeriod}
            hitSlop={12}
            style={({ pressed }) => pressed && modalStyles.pressed}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={theme.text} />
          </Pressable>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => pressed && modalStyles.pressed}>
            <MaterialCommunityIcons name="close" size={24} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.nav}>
          <Pressable
            onPress={onPrev}
            hitSlop={12}
            style={({ pressed }) => pressed && modalStyles.pressed}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="smallBold">{navLabel}</ThemedText>
          <Pressable
            onPress={onNext}
            hitSlop={12}
            style={({ pressed }) => pressed && modalStyles.pressed}>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.text} />
          </Pressable>
        </View>

        

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    maxHeight: '70%',
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    gap: Spacing.one,
  },
});
