import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, PurpleGradient, Spacing } from '@/constants/theme';

interface RegimeGhostToggleProps {
  active: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}

export function RegimeGhostToggle({ active, accessibilityLabel, onPress }: RegimeGhostToggleProps) {
  // On iOS the timeline runs under the tab bar, which sits above the home indicator.
  // On Android the screen already ends above the tab bar and the navigation buttons.
  const { bottom: bottomInset } = useSafeAreaInsets();
  const bottom =
    Platform.OS === 'ios' ? bottomInset + BottomTabInset + Spacing.three : Spacing.three;
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: active }}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        { bottom },
        !active && styles.inactive,
        pressed && styles.pressed,
      ]}>
      <LinearGradient
        colors={PurpleGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <MaterialCommunityIcons name="creation" size={22} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: Spacing.three,
    width: 40,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactive: {
    opacity: 0.45,
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
});
