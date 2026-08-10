import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/state/app-state';

interface OverlayShellProps {
  navLabel: string;
  onBack: () => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  // Opens the day-stats modal from the top bar, next to the close button.
  onStats?: () => void;
  // Full-bleed layout: the card spans the screen instead of sitting as a
  // centred sheet. The bottom inset stays — the native tab bar sits there.
  fill?: boolean;
  children: ReactNode;
}

// Shared chrome for the week/month overlays: top bar (back / close)
// and a centered card with prev/next navigation.
export function OverlayShell({
  navLabel,
  onBack,
  onClose,
  onPrev,
  onNext,
  onStats,
  fill = false,
  children,
}: OverlayShellProps) {
  const theme = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  // A filled card reaches the bottom of the screen, so it has to clear the
  // native tab bar and the home indicator underneath it.
  const fillInset = fill ? { paddingBottom: BottomTabInset + insets.bottom } : null;
  return (
    <ThemedView gradient style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        <View style={styles.top}>
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={({ pressed }) => pressed && styles.pressed}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={theme.text} />
          </Pressable>
          <View style={styles.topActions}>
            {onStats && (
              <Pressable
                accessibilityLabel={t('calendar.stats')}
                onPress={onStats}
                hitSlop={12}
                style={({ pressed }) => pressed && styles.pressed}>
                <MaterialCommunityIcons
                  name="chart-box-outline"
                  size={26}
                  color={theme.text}
                />
              </Pressable>
            )}
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => pressed && styles.pressed}>
              <MaterialCommunityIcons name="close" size={26} color={theme.text} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.body, fill && styles.bodyFill, fillInset]}>
          <ThemedView
            type="backgroundElement"
            style={[styles.card, fill && styles.cardFill]}>
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
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
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
  bodyFill: {
    paddingHorizontal: 0,
  },
  card: {
    width: '100%',
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  // Full-bleed means the screen's gradient is the background — a slab of card
  // colour over the whole screen would just flatten it.
  cardFill: {
    flex: 1,
    borderRadius: 0,
    backgroundColor: 'transparent',
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
