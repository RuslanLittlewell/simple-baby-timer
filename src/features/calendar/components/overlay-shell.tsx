import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Shared chrome for the week/month overlays: top bar (back / title / close)
// and a centered card with prev/next navigation.
export function OverlayShell({
  title,
  navLabel,
  onBack,
  onClose,
  onPrev,
  onNext,
  children,
}: {
  title: string;
  navLabel: string;
  onBack: () => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        <View style={styles.top}>
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={({ pressed }) => pressed && styles.pressed}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={theme.text} />
          </Pressable>
          <ThemedText type="subtitle">{title}</ThemedText>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => pressed && styles.pressed}>
            <MaterialCommunityIcons name="close" size={26} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.nav}>
              <Pressable
                onPress={onPrev}
                hitSlop={12}
                style={({ pressed }) => pressed && styles.pressed}>
                <MaterialCommunityIcons name="chevron-left" size={28} color={theme.text} />
              </Pressable>
              <ThemedText type="smallBold">{navLabel}</ThemedText>
              <Pressable
                onPress={onNext}
                hitSlop={12}
                style={({ pressed }) => pressed && styles.pressed}>
                <MaterialCommunityIcons name="chevron-right" size={28} color={theme.text} />
              </Pressable>
            </View>
            {children}
          </ThemedView>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    alignItems: 'center',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  body: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  card: {
    width: '100%',
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
  },
  pressed: {
    opacity: 0.5,
  },
});
