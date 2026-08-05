import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { useAppStore } from '@/state/app-state';

interface TimerToggleIconProps {
  active: boolean;
  // Row's accent color — used as a solid fill in light mode, matching the
  // pale cards there. Dark mode keeps the neutral glass circle.
  accent: string;
}

export function TimerToggleIcon({ active, accent }: TimerToggleIconProps) {
  const mode = useAppStore((state) => state.themeMode);
  const isLight = mode === 'light';

  return (
    <View
      style={[
        styles.circle,
        isLight
          ? { backgroundColor: accent, borderColor: accent }
          : styles.darkCircle,
      ]}>
      <MaterialCommunityIcons
        name={active ? 'stop' : 'play'}
        size={16}
        color="#FFFFFF"
        style={!active && styles.playGlyph}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  darkCircle: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.22)',
  },
  playGlyph: {
    marginLeft: 2,
  },
});
