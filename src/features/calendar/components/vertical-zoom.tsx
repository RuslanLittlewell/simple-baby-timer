import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { CHART_ZOOM_MAX, CHART_ZOOM_MIN } from '../constants';

interface VerticalZoomProps {
  value: number;
  // Length of the track — the column matches the height of what it zooms.
  length: number;
  onChange: (value: number) => void;
}

const TRACK = 40;
const ICON = 18;

// The platform slider is horizontal only, so it is laid out at its full length
// and rotated a quarter turn inside a fixed-width column. Touches are
// transformed with it, so dragging still follows the thumb.
export function VerticalZoom({ value, length, onChange }: VerticalZoomProps) {
  const theme = useTheme();
  const track = Math.max(0, length - (ICON + Spacing.one) * 2);

  return (
    <View style={[styles.column, { height: length }]}>
      <MaterialCommunityIcons name="magnify-plus-outline" size={ICON} color={theme.textSecondary} />
      <View style={[styles.slot, { height: track }]}>
        <Slider
          style={[styles.slider, { width: track }]}
          minimumValue={CHART_ZOOM_MIN}
          maximumValue={CHART_ZOOM_MAX}
          step={0.25}
          value={value}
          onValueChange={onChange}
          minimumTrackTintColor="#C4B5FD"
          maximumTrackTintColor={theme.border}
          thumbTintColor="#C4B5FD"
        />
      </View>
      <MaterialCommunityIcons
        name="magnify-minus-outline"
        size={ICON}
        color={theme.textSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    width: TRACK,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.one,
  },
  slot: {
    width: TRACK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slider: {
    height: TRACK,
    // Zoom in at the top of the column, out at the bottom.
    transform: [{ rotate: '-90deg' }],
  },
});
