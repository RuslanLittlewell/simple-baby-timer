import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { useAppStore } from '@/state/app-state';

interface TimerToggleIconProps {
  active: boolean;
  
  
  accent: string;
  
  
  darkBackgroundColor?: string;
}

export function TimerToggleIcon({ active, accent, darkBackgroundColor }: TimerToggleIconProps) {
  const mode = useAppStore((state) => state.themeMode);
  const isLight = mode === 'light';

  return (
    <View
      style={[
        styles.circle,
        isLight
          ? { backgroundColor: accent, borderColor: accent }
          : darkBackgroundColor
            ? { backgroundColor: darkBackgroundColor, borderColor: darkBackgroundColor }
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
