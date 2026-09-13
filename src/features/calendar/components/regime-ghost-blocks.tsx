import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing, type ThemeMode } from '@/constants/theme';
import { formatMin } from '@/features/regimes/helpers';
import { regimeGhostSegments, type PersonalRegime } from '@/lib/personal-regime';
import { useAppStore, useT } from '@/state/app-state';

import { GUTTER, TIMELINE_Z_INDEX } from '../constants';
import { minutesToPixels } from './timeline-blocks/helpers';

const LABEL_MIN_HEIGHT = 18;

interface GhostPalette {
  sleepBorder: string;
  sleepFill: string;
  settlingBorder: string;
  settlingFill: string;
  label: string;
}

const GHOST_PALETTE: Record<ThemeMode, GhostPalette> = {
  dark: {
    sleepBorder: 'rgba(167,139,250,0.75)',
    sleepFill: 'rgba(167,139,250,0.10)',
    settlingBorder: 'rgba(167,139,250,0.40)',
    settlingFill: 'rgba(167,139,250,0.04)',
    label: '#C4B5FD',
  },
  light: {
    sleepBorder: 'rgba(124,58,237,0.60)',
    sleepFill: 'rgba(124,58,237,0.07)',
    settlingBorder: 'rgba(124,58,237,0.30)',
    settlingFill: 'rgba(124,58,237,0.03)',
    label: '#6D28D9',
  },
};

interface RegimeGhostBlocksProps {
  regime: PersonalRegime;
  hourHeight: number;
}

export const RegimeGhostBlocks = memo(function RegimeGhostBlocks({
  regime,
  hourHeight,
}: RegimeGhostBlocksProps) {
  const themeMode = useAppStore((state) => state.themeMode);
  const t = useT();
  const palette = GHOST_PALETTE[themeMode];

  return (
    <View pointerEvents="none" style={styles.layer}>
      {regimeGhostSegments(regime).map((segment) => {
        const top = minutesToPixels(segment.startMin, hourHeight);
        const height = minutesToPixels(segment.endMin - segment.startMin, hourHeight);
        const sleep = segment.kind === 'sleep';
        return (
          <View
            key={`${segment.kind}-${segment.startMin}`}
            style={[
              styles.block,
              {
                top,
                height,
                borderColor: sleep ? palette.sleepBorder : palette.settlingBorder,
                backgroundColor: sleep ? palette.sleepFill : palette.settlingFill,
              },
            ]}>
            {height >= LABEL_MIN_HEIGHT && (
              <ThemedText style={[styles.label, { color: palette.label }]}>
                {`${t(sleep ? 'calendar.sleepSuggestion' : 'calendar.sleepPreparation')} · ${formatMin(segment.plannedStartMin)}–${formatMin(segment.plannedEndMin)}`}
              </ThemedText>
            )}
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: TIMELINE_Z_INDEX.ghost,
  },
  block: {
    position: 'absolute',
    left: GUTTER,
    right: Spacing.two,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  label: {
    position: 'absolute',
    top: 1,
    right: Spacing.two,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
});
